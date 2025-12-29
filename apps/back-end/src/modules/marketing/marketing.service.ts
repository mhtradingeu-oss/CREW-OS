/**
 * MARKETING SERVICE — MH-OS v2
 * Spec: docs/os/18_marketing-os.md (MASTER_INDEX)
 */
import { marketingRepository } from "../../core/db/repositories/marketing.repository.js";
import type {
  CampaignAttributionPayload,
  CampaignInteractionPayload,
  CampaignPayload,
  CampaignTargetSegmentInput,
  CampaignWhereInput,
  InputJsonValue,
  JsonValue,
} from "../../core/db/repositories/marketing.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import {
  emitMarketingCampaignStarted,
  emitMarketingCampaignStopped,
  emitMarketingCampaignAttribution,
  emitMarketingCampaignInteractionLogged,
  emitMarketingCreated,
  emitMarketingDeleted,
  emitMarketingUpdated,
} from "./marketing.events.js";
import type {
  CampaignAttributionEventPayload,
  CampaignAttributionInput,
  CampaignAttributionRecord,
  CampaignInteractionEventPayload,
  CampaignInteractionInput,
  CampaignInteractionRecord,
  CampaignRecord,
  CampaignSegmentPreview,
  CampaignTargetPreview,
  CreateMarketingInput,
  MarketingCampaignEventPayload,
  UpdateMarketingInput,
} from "./marketing.types.js";
import { orchestrateAI, makeCacheKey } from "../../core/ai/orchestrator.js";
import { marketingPrompt, seoPrompt, captionPrompt } from "../../core/ai/prompt-templates.js";
import type {
  MarketingCaptionsInput,
  MarketingCaptionsResult,
  MarketingGenerateInput,
  MarketingGenerateResult,
  MarketingSeoInput,
  MarketingSeoResult,
} from "./marketing.ai.types.js";
import { crmService } from "../crm/crm.service.js";
import type { EventContext } from "../../core/events/event-bus.js";

type MarketingActionContext = {
  brandId?: string;
  actorUserId?: string;
};

function buildMarketingEventContext(context?: MarketingActionContext): EventContext {
  return {
    brandId: context?.brandId ?? undefined,
    actorUserId: context?.actorUserId ?? undefined,
    source: "api",
  };
}

class MarketingService {
  async list(
    params: { brandId?: string; status?: string; page?: number; pageSize?: number } = {},
    context?: MarketingActionContext,
  ) {
    const { brandId, status, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: CampaignWhereInput = {};
    const scopedBrandId = context?.brandId ?? brandId;
    if (scopedBrandId) where.brandId = scopedBrandId;
    if (status) where.status = status;

    const [total, rows] = await marketingRepository.listCampaigns(where, skip, take);

    return {
      items: rows.map((row) => this.map(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string, context?: MarketingActionContext): Promise<CampaignRecord> {
    const campaign = await marketingRepository.findCampaignById(id);
    if (!campaign) throw notFound("Campaign not found");
    if (context?.brandId && campaign.brandId && campaign.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }
    return this.map(campaign);
  }

  async create(input: CreateMarketingInput, context?: MarketingActionContext): Promise<CampaignRecord> {
    if (!input.name) throw badRequest("Name is required");
    const brandId = context?.brandId ?? input.brandId ?? null;
    await this.ensureSlugIsUnique(input.name, brandId);
    const validatedSegments = await this.ensureValidSegments(input.targetSegmentIds, brandId ?? undefined);
    const created = await marketingRepository.createCampaign({
      brand: brandId ? { connect: { id: brandId } } : undefined,
      channel: input.channelId ? { connect: { id: input.channelId } } : undefined,
      name: input.name,
      objective: input.objective ?? null,
      budget: input.budget ?? null,
      status: input.status ?? "draft",
      targetSegmentIds: this.serializeSegmentIds(validatedSegments),
    });
    const eventContext = buildMarketingEventContext({
      brandId: context?.brandId ?? created.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    const payload = this.buildCampaignEventPayload(created, validatedSegments);
    await emitMarketingCreated(payload, { ...eventContext, brandId: created.brandId ?? undefined });
    if (this.isActiveStatus(payload.status)) {
      await emitMarketingCampaignStarted(payload, { ...eventContext, brandId: created.brandId ?? undefined });
    }
    return this.map(created);
  }

  async update(
    id: string,
    input: UpdateMarketingInput,
    context?: MarketingActionContext,
  ): Promise<CampaignRecord> {
    const existing = await marketingRepository.findCampaignById(id);
    if (!existing) throw notFound("Campaign not found");
    if (context?.brandId && existing.brandId && existing.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }

    const desiredBrandId = context?.brandId ?? input.brandId ?? existing.brandId;
    if (input.name && input.name !== existing.name) {
      await this.ensureSlugIsUnique(input.name, desiredBrandId, id);
    }

    const existingSegments = this.parseTargetSegmentIds(existing.targetSegmentIds) ?? [];
    const segmentIdsToStore =
      input.targetSegmentIds !== undefined
        ? await this.ensureValidSegments(input.targetSegmentIds, desiredBrandId ?? undefined)
        : existingSegments;

    const updated = await marketingRepository.updateCampaign(id, {
      brand: desiredBrandId ? { connect: { id: desiredBrandId } } : undefined,
      channel: input.channelId ? { connect: { id: input.channelId } } : undefined,
      name: input.name ?? existing.name,
      objective: input.objective ?? existing.objective,
      budget: input.budget ?? existing.budget,
      status: input.status ?? existing.status,
      targetSegmentIds: this.serializeSegmentIds(segmentIdsToStore),
    });
    const eventContext = buildMarketingEventContext({
      brandId: context?.brandId ?? updated.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    const payload = this.buildCampaignEventPayload(updated, segmentIdsToStore);
    await emitMarketingUpdated(payload, { ...eventContext, brandId: updated.brandId ?? undefined });
    const previousStatus = existing.status?.toLowerCase() ?? "";
    const currentStatus = updated.status?.toLowerCase() ?? "";
    if (previousStatus !== "active" && currentStatus === "active") {
      await emitMarketingCampaignStarted(payload, { ...eventContext, brandId: updated.brandId ?? undefined });
    } else if (previousStatus === "active" && currentStatus !== "active") {
      await emitMarketingCampaignStopped(payload, { ...eventContext, brandId: updated.brandId ?? undefined });
    }
    return this.map(updated);
  }

  async remove(id: string, context?: MarketingActionContext) {
    const existing = await marketingRepository.findCampaignById(id);
    if (!existing) throw notFound("Campaign not found");
    if (context?.brandId && existing.brandId && existing.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }
    await marketingRepository.deleteCampaign(id);
    const eventContext = buildMarketingEventContext({
      brandId: context?.brandId ?? existing.brandId ?? undefined,
      actorUserId: context?.actorUserId,
    });
    await emitMarketingDeleted(
      { id, brandId: existing.brandId ?? undefined },
      { ...eventContext, brandId: existing.brandId ?? undefined },
    );
    return { id };
  }

  async logPerformance(
    campaignId: string,
    payload: { date: Date; impressions?: number; clicks?: number; spend?: number },
  ) {
    await marketingRepository.logPerformance({
      campaign: { connect: { id: campaignId } },
      date: payload.date,
      impressions: payload.impressions ?? null,
      clicks: payload.clicks ?? null,
      spend: payload.spend ?? null,
    });
  }

  async linkLeadToCampaign(
    campaignId: string,
    input: CampaignAttributionInput,
    context?: MarketingActionContext,
  ): Promise<CampaignAttributionRecord> {
    const campaign = await marketingRepository.findCampaignById(campaignId);
    if (!campaign) {
      throw notFound("Campaign not found");
    }

    if (!input.leadId && !input.customerId) {
      throw badRequest("leadId or customerId is required");
    }

    if (input.leadId) {
      await this.ensureLeadBelongsToBrand(input.leadId, campaign.brandId);
    }
    if (input.customerId) {
      await this.ensureCustomerBelongsToBrand(input.customerId, campaign.brandId);
    }

    const created = await marketingRepository.createCampaignAttribution({
      campaign: { connect: { id: campaignId } },
      brandId: campaign.brandId ?? undefined,
      lead: input.leadId ? { connect: { id: input.leadId } } : undefined,
      customer: input.customerId ? { connect: { id: input.customerId } } : undefined,
      source: input.source ?? null,
    });

    const payload: CampaignAttributionEventPayload = {
      campaignId,
      brandId: campaign.brandId ?? undefined,
      leadId: input.leadId ?? undefined,
      customerId: input.customerId ?? undefined,
      source: input.source ?? undefined,
    };
    await emitMarketingCampaignAttribution(payload, buildMarketingEventContext(context));
    return this.mapAttribution(created);
  }

  async recordCampaignInteraction(
    campaignId: string,
    input: CampaignInteractionInput,
    context?: MarketingActionContext,
  ): Promise<CampaignInteractionRecord> {
    const campaign = await marketingRepository.findCampaignById(campaignId);
    if (!campaign) {
      throw notFound("Campaign not found");
    }

    if (!input.leadId && !input.customerId) {
      throw badRequest("leadId or customerId is required");
    }

    if (input.leadId) {
      await this.ensureLeadBelongsToBrand(input.leadId, campaign.brandId);
    }
    if (input.customerId) {
      await this.ensureCustomerBelongsToBrand(input.customerId, campaign.brandId);
    }

    const metadataValue = input.metadata ? (input.metadata as InputJsonValue) : undefined;
    const created = await marketingRepository.createCampaignInteraction({
      campaign: { connect: { id: campaignId } },
      type: input.type,
      lead: input.leadId ? { connect: { id: input.leadId } } : undefined,
      customer: input.customerId ? { connect: { id: input.customerId } } : undefined,
      metadata: metadataValue,
    });

    const payload: CampaignInteractionEventPayload = {
      campaignId,
      brandId: campaign.brandId ?? undefined,
      type: input.type,
      leadId: input.leadId ?? undefined,
      customerId: input.customerId ?? undefined,
      metadata: input.metadata ?? undefined,
    };
    await emitMarketingCampaignInteractionLogged(payload, buildMarketingEventContext(context));
    return this.mapInteraction(created);
  }

  private async ensureValidSegments(ids?: string[] | null, brandId?: string): Promise<string[]> {
    if (!ids?.length) return [];
    const uniqueIds = Array.from(new Set(ids));
    await crmService.getSegmentsByIds(uniqueIds, { brandId });
    return uniqueIds;
  }

  private async ensureLeadBelongsToBrand(leadId: string, brandId?: string | null) {
    const lead = await marketingRepository.findLeadById(leadId);
    if (!lead) {
      throw notFound("Lead not found");
    }
    if (brandId && lead.brandId && lead.brandId !== brandId) {
      throw badRequest("Lead does not belong to this campaign");
    }
  }

  private async ensureCustomerBelongsToBrand(customerId: string, brandId?: string | null) {
    const customer = await marketingRepository.findCustomerById(customerId);
    if (!customer) {
      throw notFound("Customer not found");
    }
    if (brandId && customer.brandId && customer.brandId !== brandId) {
      throw badRequest("Customer does not belong to this campaign");
    }
  }

  private buildCampaignEventPayload(
    campaign: CampaignPayload,
    segments?: string[],
  ): MarketingCampaignEventPayload {
    const resolved =
      segments && segments.length ? segments : this.parseTargetSegmentIds(campaign.targetSegmentIds);
    return {
      id: campaign.id,
      brandId: campaign.brandId ?? undefined,
      channelId: campaign.channelId ?? undefined,
      status: campaign.status ?? undefined,
      targetSegmentIds: resolved && resolved.length ? resolved : undefined,
    };
  }

  private isActiveStatus(status?: string | null) {
    return status?.toLowerCase() === "active";
  }

  private serializeSegmentIds(
    ids?: string[] | null,
  ): CampaignTargetSegmentInput | undefined {
    if (!ids || ids.length === 0) return undefined;
    return ids as CampaignTargetSegmentInput;
  }

  private parseTargetSegmentIds(value?: JsonValue | null): string[] | undefined {
    if (!value) return undefined;
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string").map((item) => item);
    }
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === "string");
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  async previewCampaignTargets(
    campaignId: string,
    context?: MarketingActionContext,
    limit = 5,
  ): Promise<CampaignTargetPreview> {
    const campaign = await marketingRepository.findCampaignTargetSegments(campaignId);
    if (!campaign) {
      throw notFound("Campaign not found");
    }
    if (context?.brandId && campaign.brandId && campaign.brandId !== context.brandId) {
      throw forbidden("Access denied for this brand");
    }
    const segmentIds = this.parseTargetSegmentIds(campaign.targetSegmentIds) ?? [];
    const resolvedBrandId = context?.brandId ?? campaign.brandId ?? undefined;
    let totalLeads = 0;
    const segments: CampaignSegmentPreview[] = [];
    for (const segmentId of segmentIds) {
      const segment = await crmService.getSegmentById(segmentId, { brandId: resolvedBrandId });
      const resolved = await crmService.resolveSegmentLeads(
        segmentId,
        { limit },
        { brandId: resolvedBrandId },
      );
      totalLeads += resolved.total;
      segments.push({
        segmentId,
        segmentName: segment.name,
        total: resolved.total,
        sample: resolved.leads.map((lead) => ({
          id: lead.id,
          name: lead.name,
          email: lead.email,
          score: lead.score,
          status: lead.status,
        })),
      });
    }
    return {
      campaignId,
      totalLeads,
      segments,
    };
  }

  private map(row: CampaignPayload): CampaignRecord {
    return {
      id: row.id,
      brandId: row.brandId ?? undefined,
      channelId: row.channelId ?? undefined,
      name: row.name,
      objective: row.objective ?? undefined,
      budget: row.budget ? Number(row.budget) : null,
      status: row.status ?? undefined,
      targetSegmentIds: this.parseTargetSegmentIds(row.targetSegmentIds),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private mapAttribution(record: CampaignAttributionPayload): CampaignAttributionRecord {
    return {
      id: record.id,
      campaignId: record.campaignId,
      brandId: record.brandId ?? undefined,
      leadId: record.leadId ?? undefined,
      customerId: record.customerId ?? undefined,
      source: record.source ?? undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapInteraction(record: CampaignInteractionPayload): CampaignInteractionRecord {
    return {
      id: record.id,
      campaignId: record.campaignId,
      type: record.type,
      leadId: record.leadId ?? undefined,
      customerId: record.customerId ?? undefined,
      metadata: record.metadata ? (record.metadata as Record<string, unknown>) : undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private slugify(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private async ensureSlugIsUnique(
    value: string,
    brandId: string | null | undefined,
    excludeId?: string,
  ) {
    const slug = this.slugify(value);
    const campaigns = await marketingRepository.findCampaignsByBrand(brandId ?? null);
    const duplicate = campaigns.find((campaign) => {
      if (excludeId && campaign.id === excludeId) return false;
      return this.slugify(campaign.name) === slug;
    });
    if (duplicate) {
      throw badRequest("Campaign slug already exists for this brand");
    }
  }
}

export const marketingService = new MarketingService();

export const marketingAIService = {
  async generate(payload: MarketingGenerateInput): Promise<MarketingGenerateResult> {
    const prompt = marketingPrompt(payload);
    const cacheKey = makeCacheKey("marketing-generate", {
      ...payload,
      brandId: payload.brandId,
      tenantId: (payload as { tenantId?: string }).tenantId,
    });
    const response = await orchestrateAI<MarketingGenerateResult>({
      key: cacheKey,
      messages: [{ role: "user", content: prompt }],
      fallback: (): MarketingGenerateResult => ({
        headline: payload.goal,
        body: "Draft copy based on goal.",
        cta: "Learn more",
        keywords: [payload.goal],
        tone: payload.tone ?? "friendly",
      }),
    });
    await marketingAIService.logMarketingInsight(payload.brandId, "generate", response.result);
    return response.result;
  },
  async seo(payload: MarketingSeoInput): Promise<MarketingSeoResult> {
    const prompt = seoPrompt(payload);
    const cacheKey = makeCacheKey("marketing-seo", {
      ...payload,
      brandId: payload.brandId,
      tenantId: (payload as { tenantId?: string }).tenantId,
    });
    const response = await orchestrateAI<MarketingSeoResult>({
      key: cacheKey,
      messages: [{ role: "user", content: prompt }],
      fallback: (): MarketingSeoResult => ({
        title: payload.topic,
        keywords: [payload.topic, "seo"],
        description: `SEO ideas for ${payload.topic}`,
      }),
    });
    await marketingAIService.logMarketingInsight(payload.brandId, "seo", response.result);
    return response.result;
  },
  async captions(payload: MarketingCaptionsInput): Promise<MarketingCaptionsResult> {
    const prompt = captionPrompt(payload);
    const cacheKey = makeCacheKey("marketing-captions", {
      ...payload,
      brandId: payload.brandId,
      tenantId: (payload as { tenantId?: string }).tenantId,
    });
    const response = await orchestrateAI<MarketingCaptionsResult>({
      key: cacheKey,
      messages: [{ role: "user", content: prompt }],
      fallback: (): MarketingCaptionsResult => ({
        captions: [`${payload.topic} rocks!`, `Learn more about ${payload.topic}`],
      }),
    });
    await marketingAIService.logMarketingInsight(payload.brandId, "captions", response.result);
    return response.result;
  },
  async logMarketingInsight(
    brandId: string | undefined,
    insightType: string,
    payload: MarketingGenerateResult | MarketingSeoResult | MarketingCaptionsResult,
  ) {
    await marketingRepository.logAIInsight({
      brand: brandId ? { connect: { id: brandId } } : undefined,
      os: "marketing",
      entityType: `marketing-${insightType}`,
      entityId: brandId ?? insightType,
      summary: `Marketing ${insightType} insight`,
      details: JSON.stringify({
        payload,
        confidence: null,
        risk: null,
      }),
    });
  },
};
