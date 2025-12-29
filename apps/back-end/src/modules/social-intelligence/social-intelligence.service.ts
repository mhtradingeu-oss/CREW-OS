import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";
import {
  emitMentionIngested,
  emitSocialInsightGenerated,
  emitTrendDetected,
  emitTrendUpdated,
} from "./social-intelligence.events.js";
import {
  CompetitorSocialReportRecord,
  CreateInfluencerInput,
  CreateTrendInput,
  IngestMentionInput,
  IngestTrendInput,
  InfluencerRecord,
  PaginatedResponse,
  SocialAISummaryInput,
  SocialAISummaryResult,
  SocialMentionRecord,
  SocialInsightResult,
  SocialTrendRecord,
  UpdateInfluencerInput,
  UpdateTrendInput,
} from "./social-intelligence.types.js";
import { socialIntelligenceRepository } from "../../core/db/repositories/social-intelligence.repository.js";

const SPIKE_WINDOW_HOURS = 6;
const SPIKE_THRESHOLD = 10;

class SocialIntelligenceService {
  // TODO: implement actual spike detection logic when data is available
  private async detectMentionSpike(_mention: SocialMentionRecord): Promise<void> {
    // spike detection logic placeholder
  }

  // Persist a trend and emit spike if detected
  async persistTrend(input: CreateTrendInput): Promise<SocialTrendRecord> {
    const { createTrend } = socialIntelligenceRepository;
    const trend = await createTrend(input);
    // Simple spike detection: score above threshold
    if (trend.score && trend.score > SPIKE_THRESHOLD) {
      await emitTrendDetected({
        brandId: trend.brandId ?? undefined,
        entityType: "trend",
        entityId: trend.id,
        action: "spike_detected",
        metadata: { topic: trend.topic, score: trend.score },
      });
    }
    return trend;
  }

  // Only generate insight, no auto-actions

  private buildSocialInsightPrompt(
    brandId: string,
    mentions: SocialMentionRecord[],
    trends: SocialTrendRecord[],
    competitorReports: CompetitorSocialReportRecord[],
  ) {
    return `Brand: ${brandId}\nMentions: ${mentions.length}\nTrends: ${trends.length}\nCompetitor Reports: ${competitorReports.length}`;
  }

  // ...existing code...

  private extractActions(_details: string) {
    return [] as string[];
  }

  async listMentions(params: {
    brandId?: string;
    platform?: string;
    sentiment?: string;
    keyword?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<SocialMentionRecord>> {
    return socialIntelligenceRepository.listMentions(params);
  }

  async getMention(id: string): Promise<SocialMentionRecord> {
    const record = await socialIntelligenceRepository.getMentionById(id);
    if (!record) throw notFound("Mention not found");
    return record;
  }

  async ingestMention(input: IngestMentionInput): Promise<SocialMentionRecord> {
    if (!input.brandId) throw badRequest("brandId is required");
    const mention = await socialIntelligenceRepository.createMention(input);
    await emitMentionIngested({
      brandId: mention.brandId ?? undefined,
      entityType: "mention",
      entityId: mention.id,
      action: "ingested",
      metadata: {
        platform: mention.platform,
        keyword: mention.keyword,
        sentiment: mention.sentiment,
      },
    });
    await this.detectMentionSpike(mention);
    return mention;
  }

  async listInfluencers(params: {
    brandId?: string;
    platform?: string;
    tag?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<InfluencerRecord>> {
    return socialIntelligenceRepository.listInfluencers(params);
  }

  async createInfluencer(input: CreateInfluencerInput): Promise<InfluencerRecord> {
    return socialIntelligenceRepository.createInfluencer(input);
  }

  async updateInfluencer(id: string, input: UpdateInfluencerInput): Promise<InfluencerRecord> {
    const existing = await socialIntelligenceRepository.findInfluencerById(id);
    if (!existing) throw notFound("Influencer not found");
    return socialIntelligenceRepository.updateInfluencer(id, input);
  }

  async deleteInfluencer(id: string) {
    const existing = await socialIntelligenceRepository.findInfluencerById(id);
    if (!existing) throw notFound("Influencer not found");
    await socialIntelligenceRepository.deleteInfluencer(id);
    return { id };
  }

  async listTrends(params: {
    brandId?: string;
    platform?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<SocialTrendRecord>> {
    return socialIntelligenceRepository.listTrends(params);
  }

  async createTrend(input: CreateTrendInput): Promise<SocialTrendRecord> {
    if (!input.topic) throw badRequest("Trend topic is required");
    const created = await socialIntelligenceRepository.createTrend(input);
    await emitTrendDetected({
      brandId: created.brandId ?? undefined,
      entityType: "trend",
      entityId: created.id,
      action: "detected",
      metadata: {
        topic: created.topic,
        platform: created.platform,
        score: created.score,
      },
    });
    return created;
  }

  async ingestTrend(input: IngestTrendInput): Promise<SocialTrendRecord> {
    if (!input.brandId) throw badRequest("brandId is required");
    const existing = await socialIntelligenceRepository.findTrendByUniqueKey({
      brandId: input.brandId,
      topic: input.topic,
      platform: input.platform,
    });
    if (existing) {
      const updated = await socialIntelligenceRepository.updateTrend(existing.id, input);
      await emitTrendUpdated({
        brandId: updated.brandId ?? undefined,
        entityType: "trend",
        entityId: updated.id,
        action: "updated",
        metadata: {
          topic: updated.topic,
          platform: updated.platform,
          previousScore: existing.score,
          score: updated.score,
        },
      });
      return updated;
    }
    const created = await socialIntelligenceRepository.createTrend(input);
    await emitTrendDetected({
      brandId: created.brandId ?? undefined,
      entityType: "trend",
      entityId: created.id,
      action: "detected",
      metadata: {
        topic: created.topic,
        platform: created.platform,
        score: created.score,
      },
    });
    return created;
  }

  async updateTrend(id: string, input: UpdateTrendInput): Promise<SocialTrendRecord> {
    const existing = await socialIntelligenceRepository.findTrendById(id);
    if (!existing) throw notFound("Trend not found");
    const updated = await socialIntelligenceRepository.updateTrend(id, input);
    await emitTrendUpdated({
      brandId: updated.brandId ?? undefined,
      entityType: "trend",
      entityId: updated.id,
      action: "updated",
      metadata: {
        topic: updated.topic,
        platform: updated.platform,
        previousScore: existing.score,
        score: updated.score,
      },
    });
    return updated;
  }

  async deleteTrend(id: string) {
    const existing = await socialIntelligenceRepository.findTrendById(id);
    if (!existing) throw notFound("Trend not found");
    await socialIntelligenceRepository.deleteTrend(id);
    return { id };
  }

  async listCompetitorReports(params: {
    brandId?: string;
    competitor?: string;
    page?: number;
    pageSize?: number;
  }): Promise<PaginatedResponse<CompetitorSocialReportRecord>> {
    return socialIntelligenceRepository.listCompetitorReports(params);
  }

  async getInsight(brandId: string, entityType: string, entityId: string) {
    const insight = await socialIntelligenceRepository.findInsight(brandId, entityType, entityId);
    if (!insight) throw notFound("Insight not found");
    return insight;
  }

  async summarizeAI(payload: SocialAISummaryInput): Promise<SocialAISummaryResult> {
    const prompt = this.buildPrompt(payload);
    const response = await runAIRequest({
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are the MH-OS social intelligence analyst. Provide high-level summaries.",
        },
        { role: "user", content: prompt },
      ],
    });
    const details =
      response.success && response.content
        ? response.content.trim()
        : "AI summary is unavailable right now.";
    const summary = this.extractSummary(details);
    const insight = await socialIntelligenceRepository.createInsight({
      brandId: payload.brandId,
      os: "social",
      entityType: payload.entityType,
      entityId: payload.entityId ?? null,
      summary,
      details,
    });
    logger.info(`[social-intelligence] Created AI insight ${insight.id}`);
    return {
      id: insight.id,
      summary: insight.summary ?? summary,
      details: insight.details ?? details,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  }

  async generateSocialInsight(brandId: string): Promise<SocialInsightResult> {
    const [mentions, trends, competitorReports] = await Promise.all([
      socialIntelligenceRepository.getRecentMentionsForBrand(brandId),
      socialIntelligenceRepository.getRecentTrendsForBrand(brandId),
      socialIntelligenceRepository.getRecentCompetitorReportsForBrand(brandId),
    ]);
    const prompt = this.buildSocialInsightPrompt(brandId, mentions, trends, competitorReports);
    const response = await runAIRequest({
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are the MH-OS Social Intelligence analyst. Provide concise insights for marketing and automation.",
        },
        { role: "user", content: prompt },
      ],
    });
    const details =
      response.success && response.content
        ? response.content.trim()
        : "No AI insight available at this time.";
    const summary = this.extractSummary(details);
    const suggestedActions = this.extractActions(details);
    const insight = await socialIntelligenceRepository.createInsight({
      brandId,
      os: "social-intel",
      entityType: "brand",
      entityId: brandId,
      summary,
      details,
    });
    await emitSocialInsightGenerated({
      brandId,
      entityType: "brand",
      entityId: brandId,
      action: "generated",
      metadata: { insightId: insight.id },
    });
    return {
      id: insight.id,
      brandId,
      summary,
      details,
      suggestedActions,
      generatedAt: insight.createdAt,
    };
  }

  private buildPrompt(payload: SocialAISummaryInput) {
    const lines = [
      `Brand: ${payload.brandId}`,
      `Entity Type: ${payload.entityType}`,
      `Entity ID: ${payload.entityId ?? "unspecified"}`,
      `Context: ${payload.context ?? "None"}`,
      "Summarize sentiment, trends, and suggested actions in bullet points.",
    ];
    return lines.join("\n");
  }

  private extractSummary(details: string) {
    const trimmed = details.trim();
    if (!trimmed) return "Summary not available";
    const [firstLine = ""] = trimmed.split("\n");
    return firstLine.replace(/^summary:\s*/i, "").trim() || trimmed;
  }
}

export const social_intelligenceService = new SocialIntelligenceService();
