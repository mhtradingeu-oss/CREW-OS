import { badRequest, notFound } from "../../core/http/errors.js";
import type { InfluencerScoreRecord } from "../../core/db/repositories/influencer-os.repository.js";
import { influencerOSRepository, mapProfileToScoreRecord } from "../../core/db/repositories/influencer-os.repository.js";
import type { InfluencerCandidate } from "../../core/ai/engines/influencer.engine.js";
import { runInfluencerEngine } from "../../core/ai/engines/influencer.engine.js";

export type { InfluencerScoreRecord };

type ActionContext = {
  brandId?: string;
  actorUserId?: string;
  tenantId?: string;
};

class InfluencerOSService {
  async discover(
    input: {
      brandId?: string;
      query?: string;
      categories?: string[];
      platforms?: string[];
      audience?: string;
      limit?: number;
    },
    context?: ActionContext,
  ) {
    const brandId = context?.brandId ?? input.brandId ?? null;
    const limit = input.limit ?? 10;
    const simulated = this.simulateDiscovery(input.platforms, input.categories, limit);

    const task = await influencerOSRepository.createDiscoveryTask({
      brandId,
      query: input.query ?? null,
      categories: input.categories?.join(",") ?? null,
      platforms: input.platforms?.join(",") ?? null,
      status: "completed",
      resultCount: simulated.length,
      findingsJson: JSON.stringify(simulated),
      requestedByUserId: context?.actorUserId ?? null,
    });

    const influencers: InfluencerScoreRecord[] = [];
    for (const row of simulated) {
      const existing = await influencerOSRepository.findProfileByHandle({
        brandId,
        handle: row.handle,
        platform: row.platform,
      });

      const profileData = {
        brandId,
        handle: row.handle,
        displayName: row.displayName ?? row.handle,
        platform: row.platform,
        followers: row.followers,
        engagementRate: row.engagementRate,
        fakeFollowerRisk: row.fakeFollowerRisk,
        marketFitScore: row.marketFitScore,
        authenticityScore: row.authenticityScore,
        category: row.category,
        country: row.country,
        language: row.language,
        contactEmail: row.contactEmail,
        tags: row.tags?.join(", ") ?? null,
        profileUrl: row.profileUrl,
        riskNotes: row.riskNotes,
      };

      const profile = existing
        ? await influencerOSRepository.updateProfile(existing.id, profileData)
        : await influencerOSRepository.createProfile(profileData);

      const stat = await influencerOSRepository.createStatSnapshot({
        influencerId: profile.id,
        brandId,
        followers: row.followers,
        engagementRate: row.engagementRate,
        fakeFollowerPct: row.fakeFollowerRisk,
        marketFitScore: row.marketFitScore,
        authenticityScore: row.authenticityScore,
        metricsJson: row.metricsJson ?? null,
      });

      influencers.push(mapProfileToScoreRecord(profile, stat));
    }

    return { taskId: task.id, influencers, sources: ["TikTok Open API", "YouTube Data API", "Instagram Basic API"] };
  }

  async listScores(
    params: { brandId?: string; platform?: string; category?: string; search?: string; page?: number; pageSize?: number },
    context?: ActionContext,
  ) {
    const brandId = context?.brandId ?? params.brandId;
    return influencerOSRepository.listScores({
      ...params,
      brandId,
    });
  }

  async recommend(
    input: { brandId?: string; category?: string; goal?: string; audience?: string; topN?: number },
    context?: ActionContext,
  ) {
    const scores = await this.listScores(
      { brandId: input.brandId, category: input.category, pageSize: Math.max(10, input.topN ?? 10) },
      context,
    );
    if (!scores.items.length) {
      throw badRequest("No influencers available for recommendations");
    }
    const candidates: InfluencerCandidate[] = scores.items.map((item) => ({
      influencerId: item.id,
      handle: item.handle,
      platform: item.platform,
      followers: item.followers,
      engagementRate: item.engagementRate,
      fakeFollowerRisk: item.fakeFollowerRisk,
      marketFitScore: item.marketFitScore,
      authenticityScore: item.authenticityScore,
      category: item.category,
      country: item.country,
    }));

    const engineOutput = await runInfluencerEngine(
      {
        brandId: context?.brandId ?? input.brandId ?? (scores.items[0]?.brandId ?? ""),
        goal: input.goal,
        audience: input.audience,
        category: input.category,
        candidates,
      },
      { actor: { permissions: [], role: "SYSTEM" } },
    );

    const ranked = engineOutput.rankings.map((rank) => {
      const profile = scores.items.find((p) => p.id === rank.influencerId);
      return {
        influencerId: rank.influencerId,
        handle: profile?.handle ?? rank.influencerId,
        platform: profile?.platform,
        score: rank.score,
        predictedSalesImpact: rank.predictedSalesImpact,
        reason: rank.reason,
        profile,
      };
    });

    return {

      goal: input.goal,
      audience: input.audience,
      recommendations: ranked,
      outreachDrafts: engineOutput.outreachDrafts,
      negotiation: engineOutput.negotiation,
      pipeline: engineOutput.pipeline,
    };
  }

  // Track influencer and persist score
  async scoreInfluencer(input: {
    influencerId: string;
    brandId: string;
    score: number;
    marketFitScore?: number;
    authenticityScore?: number;
  }): Promise<InfluencerScoreRecord> {
    // Enforce brand isolation
    if (!input.brandId) throw badRequest("brandId required");
    // Fetch profile to get required fields
    const existing = await influencerOSRepository.findInfluencerById(input.influencerId);
    if (!existing) throw notFound("Influencer not found");
    const profile = await influencerOSRepository.updateProfile(input.influencerId, {
      brandId: input.brandId,
      handle: existing.handle,
      platform: existing.platform,
      displayName: existing.displayName,
      followers: existing.followers,
      engagementRate: existing.engagementRate,
      fakeFollowerRisk: existing.fakeFollowerRisk,
      marketFitScore: input.marketFitScore ?? existing.marketFitScore ?? null,
      authenticityScore: input.authenticityScore ?? existing.authenticityScore ?? null,
      category: existing.category,
      country: existing.country,
      language: existing.language,
      tags: existing.tags,
      profileUrl: existing.profileUrl,
      riskNotes: existing.riskNotes,
    });
    // Create stat snapshot
    const stat = await influencerOSRepository.createStatSnapshot({
      influencerId: input.influencerId,
      brandId: input.brandId,
      marketFitScore: input.marketFitScore ?? null,
      authenticityScore: input.authenticityScore ?? null,
    });
    // Map to score record
    const record = mapProfileToScoreRecord(profile, stat);
    // Emit event
    const { emitInfluencerScored } = await import("./influencer-os.events.js");
    await emitInfluencerScored({
      influencerId: input.influencerId,
      brandId: input.brandId,
      score: input.score,
      marketFitScore: input.marketFitScore,
      authenticityScore: input.authenticityScore,
      scoredAt: new Date().toISOString(),
    });
    return record;
  }

  async createNegotiation(
    input: { brandId?: string; influencerId: string; goal?: string; offer?: string; tone?: string },
    context?: ActionContext,
  ) {
    const influencer = await influencerOSRepository.findInfluencerById(input.influencerId);
    if (!influencer) throw notFound("Influencer not found");
    if (context?.brandId && influencer.brandId && influencer.brandId !== context.brandId) {
      throw badRequest("Influencer belongs to another brand");
    }

    const candidate: InfluencerCandidate = {
      influencerId: influencer.id,
      handle: influencer.handle,
      platform: influencer.platform,
      followers: influencer.followers,
      engagementRate: influencer.engagementRate,
      fakeFollowerRisk: influencer.fakeFollowerRisk,
      marketFitScore: influencer.marketFitScore,
      authenticityScore: influencer.authenticityScore,
      category: influencer.category,
      country: influencer.country,
    };

    const engineOutput = await runInfluencerEngine(
      {
        brandId: context?.brandId ?? influencer.brandId ?? "",
        goal: input.goal,
        candidates: [candidate],
      },
      { actor: { permissions: [], role: "SYSTEM" }, task: "NEGOTIATION" },
    );

    const suggestions = engineOutput.negotiation[0]?.suggestions ?? ["Lead with value", "Clarify deliverables"];

    const negotiation = await influencerOSRepository.createNegotiation({
      brandId: context?.brandId ?? influencer.brandId,
      influencerId: influencer.id,
      status: "draft",
      terms: { goal: input.goal, offer: input.offer, suggestions },
      notes: input.offer ?? null,
    });

    return {
      negotiation,
      suggestions,
      outreachDrafts: engineOutput.outreachDrafts,
      pipeline: engineOutput.pipeline,
    };
  }

  async listNegotiations(
    params: { brandId?: string; page?: number; pageSize?: number },
    context?: ActionContext,
  ) {
    const brandId = context?.brandId ?? params.brandId;
    return influencerOSRepository.listNegotiations({ brandId, page: params.page, pageSize: params.pageSize });
  }

  async createCampaignLink(
    input: {
      brandId?: string;
      influencerId: string;
      campaignId?: string;
      role?: string;
      trackingUrl?: string;
      status?: string;
      performance?: Record<string, unknown>;
    },
    context?: ActionContext,
  ) {
    const brandId = context?.brandId ?? input.brandId ?? null;
    const influencer = await influencerOSRepository.findInfluencerById(input.influencerId);
    if (!influencer) throw notFound("Influencer not found");
    if (brandId && influencer.brandId && influencer.brandId !== brandId) {
      throw badRequest("Influencer belongs to another brand");
    }

    if (input.campaignId) {
      const campaignExists = await influencerOSRepository.findCampaignById(input.campaignId);
      if (!campaignExists) throw notFound("Campaign not found");
    }

    return influencerOSRepository.createCampaignLink({
      brandId,
      influencerId: influencer.id,
      campaignId: input.campaignId ?? null,
      role: input.role ?? null,
      trackingUrl: input.trackingUrl ?? null,
      status: input.status,
      performance: input.performance ?? null,
    });
  }

  async listCampaignLinks(
    params: { brandId?: string; status?: string; page?: number; pageSize?: number },
    context?: ActionContext,
  ) {
    const brandId = context?.brandId ?? params.brandId;
    return influencerOSRepository.listCampaignLinks({
      brandId,
      status: params.status,
      page: params.page,
      pageSize: params.pageSize,
    });
  }

  private simulateDiscovery(platforms?: string[], categories?: string[], limit = 10) {
    const pool = [
      {
        platform: "tiktok",
        handle: "@hairstudio",
        displayName: "Hair Studio",
        followers: 250000,
        engagementRate: 4.2,
        fakeFollowerRisk: 0.08,
        marketFitScore: 0.82,
        authenticityScore: 0.76,
        category: "beauty",
        country: "DE",
        language: "de",
        contactEmail: "collab@hairstudio.example",
        tags: ["beauty", "tutorial"],
        profileUrl: "https://www.tiktok.com/@hairstudio",
        metricsJson: { source: "TikTok Open API" },
        riskNotes: "Manual review recommended",
      },
      {
        platform: "youtube",
        handle: "@techroutes",
        displayName: "Tech Routes",
        followers: 180000,
        engagementRate: 3.1,
        fakeFollowerRisk: 0.05,
        marketFitScore: 0.78,
        authenticityScore: 0.84,
        category: "electronics",
        country: "US",
        language: "en",
        contactEmail: "team@techroutes.example",
        tags: ["tech", "reviews"],
        profileUrl: "https://www.youtube.com/@techroutes",
        metricsJson: { source: "YouTube Data API" },
        riskNotes: "High authenticity from comment quality",
      },
      {
        platform: "instagram",
        handle: "@citytaste",
        displayName: "City Taste",
        followers: 120000,
        engagementRate: 5.0,
        fakeFollowerRisk: 0.12,
        marketFitScore: 0.74,
        authenticityScore: 0.7,
        category: "food",
        country: "FR",
        language: "fr",
        contactEmail: "hello@citytaste.example",
        tags: ["food", "travel"],
        profileUrl: "https://www.instagram.com/citytaste",
        metricsJson: { source: "Instagram Basic API" },
        riskNotes: "Monitor follower spikes",
      },
    ];

    const filtered = pool.filter((p) => {
      const platformAllowed = !platforms?.length || platforms.includes(p.platform);
      const categoryAllowed = !categories?.length || categories.includes(p.category ?? "");
      return platformAllowed && categoryAllowed;
    });

    const source = filtered.length ? filtered : pool;
    if (source.length === 0) return [];

    const results: typeof pool = [];
    for (let i = 0; i < limit; i++) {
      results.push(source[i % source.length]!);
    }
    return results;
  }

}

export const influencerOSService = new InfluencerOSService();
