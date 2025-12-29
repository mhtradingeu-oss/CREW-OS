/**
 * BRAND SERVICE — MH-OS v2
 * Spec: docs/os/02_brand-overview.md (MASTER_INDEX)
 */
import type { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../../core/prisma.js";
import { BrandRepository } from "../../core/db/repositories/brand.repository.js";
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import type { AIMessage } from "../../core/ai-service/ai-client.js";
import { logger } from "../../core/logger.js";
import { orchestrateAI, makeCacheKey } from "../../core/ai/orchestrator.js";
import { logExecution, recordSafetyEvent, estimateTokens, estimateCostUsd } from "../../core/ai/ai-monitoring.js";
import { activityLogService } from "../activity-log/activity-log.service.js";
import type { EventEnvelope } from "../../core/events/event-bus.js";
import { type PlanContext } from "../../core/plans-resolver.js";
import {
  emitBrandAiConfigUpdated,
  emitBrandCreated,
  emitBrandDeleted,
  emitBrandIdentityAiGenerated,
  emitBrandIdentityUpdated,
  emitBrandRulesUpdated,
  emitBrandRulesAiGenerated,
  emitBrandUpdated,
} from "./brand.events.js";
import type {
  BrandAIConfigResponse,
  BrandAiIdentityResponse,
  BrandIdentityInput,
  BrandIdentityResponse,
  BrandListParams,
  BrandResponse,
  BrandRulesResponse,
  BrandSettings,
  CreateBrandInput,
  PaginatedBrands,
  UpdateBrandInput,
} from "./brand.types.js";
import { buildIdentityPrompt, buildRulesConsistencyPrompt } from "./brand.prompts.js";

const brandSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  countryOfOrigin: true,
  defaultCurrency: true,
  settingsJson: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandSelect;

const identitySelect = {
  id: true,
  brandId: true,
  vision: true,
  mission: true,
  values: true,
  toneOfVoice: true,
  persona: true,
  brandStory: true,
  keywords: true,
  colorPalette: true,
  packagingStyle: true,
  socialProfilesJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandIdentitySelect;

const aiInsightSelect = {
  id: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

const rulesSelect = {
  id: true,
  brandId: true,
  namingRules: true,
  descriptionRules: true,
  marketingRules: true,
  discountRules: true,
  pricingConstraints: true,
  restrictedWords: true,
  allowedWords: true,
  aiRestrictions: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandRulesSelect;

const aiConfigSelect = {
  id: true,
  brandId: true,
  aiPersonality: true,
  aiTone: true,
  aiContentStyle: true,
  aiPricingStyle: true,
  aiEnabledActionsJson: true,
  aiBlockedTopicsJson: true,
  aiModelVersion: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.BrandAIConfigSelect;

export type BrandAccessContext = {
  tenantId?: string | null;
  brandId?: string | null;
  role?: string | null;
  planContext?: PlanContext;
};

class BrandService {
  constructor(private readonly repo = BrandRepository) {}

  async list(params: BrandListParams = {}, context: BrandAccessContext = {}): Promise<PaginatedBrands> {
    const { search, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: Prisma.BrandWhereInput = {};
    if (context.brandId) {
      where.id = context.brandId;
    }
    if (context.tenantId) {
      where.tenantId = context.tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, items] = await this.repo.listBrandsWithCount({ where, skip, take });

    return {
      items: items.map((brand) => this.mapResponse(brand)),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string, context: BrandAccessContext = {}): Promise<BrandResponse> {
    const brand = await this.fetchScopedBrand(id, context);
    return this.mapResponse(brand);
  }

  async create(input: CreateBrandInput, context: BrandAccessContext = {}): Promise<BrandResponse> {
    const tenantId = this.resolveTenantForMutation(context, input.tenantId);
    await this.enforceBrandLimit(tenantId, context.planContext);

    await this.ensureSlugIsUnique(input.slug);
    const linkedUserIds = await this.resolveUsers(input.userIds, tenantId, context);
    const settingsUpdates: BrandSettings = {
      ...(input.settings ?? {}),
      metadata: input.metadata,
      preferences: input.preferences,
      linkedUserIds,
    };
    const brandSettings = this.mergeSettings({}, settingsUpdates);

    const brand = await this.repo.createBrand({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        countryOfOrigin: input.countryOfOrigin ?? null,
        defaultCurrency: input.defaultCurrency ?? null,
        tenantId,
        settingsJson: this.serializeSettings(brandSettings),
      },
      select: brandSelect,
    });

    await emitBrandCreated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: tenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.created", { brandId: brand.id, tenantId: tenantId ?? undefined }, context);
    return this.mapResponse(brand);
  }

  async update(id: string, input: UpdateBrandInput, context: BrandAccessContext = {}): Promise<BrandResponse> {
    const existing = await this.fetchScopedBrand(id, context);

    if (input.slug && input.slug !== existing.slug) {
      await this.ensureSlugIsUnique(input.slug);
    }

    const targetTenantId =
      typeof input.tenantId !== "undefined"
        ? this.resolveTenantForMutation(context, input.tenantId)
        : existing.tenantId;

    if (targetTenantId !== existing.tenantId) {
      await this.enforceBrandLimit(targetTenantId, context.planContext);
    }

    const linkedUserIds = await this.resolveUsers(input.userIds, targetTenantId, context);
    const settingsUpdates: BrandSettings = {
      ...(input.settings ?? {}),
      metadata: input.metadata,
      preferences: input.preferences,
      linkedUserIds,
    };
    const mergedSettings = this.mergeSettings(
      this.parseSettings(existing.settingsJson),
      settingsUpdates,
    );

    const updated = await this.repo.updateBrand({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        slug: input.slug ?? existing.slug,
        description: input.description ?? existing.description,
        countryOfOrigin: input.countryOfOrigin ?? existing.countryOfOrigin,
        defaultCurrency: input.defaultCurrency ?? existing.defaultCurrency,
        tenantId: targetTenantId,
        settingsJson: this.serializeSettings(mergedSettings),
      },
      select: brandSelect,
    });

    await emitBrandUpdated(
      { id: updated.id, name: updated.name },
      { brandId: updated.id, tenantId: targetTenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.updated", { brandId: updated.id, tenantId: targetTenantId ?? undefined }, context);
    return this.mapResponse(updated);
  }

  async remove(id: string, context: BrandAccessContext = {}) {
    const brand = await this.fetchScopedBrand(id, context);

    await this.repo.deleteBrand({ where: { id } });
    await emitBrandDeleted(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.deleted", { brandId: brand.id, tenantId: brand.tenantId ?? undefined }, context);
    return { id };
  }

  private parseSettings(settingsJson?: string | null): BrandSettings {
    if (!settingsJson) return {};
    try {
      const parsed = JSON.parse(settingsJson) as BrandSettings;
      return parsed ?? {};
    } catch {
      return {};
    }
  }

  private serializeSettings(settings: BrandSettings): string | null {
    const cleaned = Object.keys(settings).length ? settings : null;
    return cleaned ? JSON.stringify(cleaned) : null;
  }

  private mergeSettings(current: BrandSettings, updates: BrandSettings): BrandSettings {
    const next: BrandSettings = { ...current };

    if (updates.metadata) {
      next.metadata = { ...(current.metadata ?? {}), ...updates.metadata };
    }

    if (updates.preferences) {
      next.preferences = { ...(current.preferences ?? {}), ...updates.preferences };
    }

    if (updates.linkedUserIds) {
      next.linkedUserIds = Array.from(new Set(updates.linkedUserIds));
    }

    const reservedKeys = new Set(["metadata", "preferences", "linkedUserIds"]);
    Object.entries(updates).forEach(([key, value]) => {
      if (!reservedKeys.has(key)) {
        next[key] = value;
      }
    });

    return next;
  }

  private mapResponse(
    record: Prisma.BrandGetPayload<{ select: typeof brandSelect }>,
  ): BrandResponse {
    return {
      id: record.id,
      name: record.name,
      slug: record.slug,
      description: record.description,
      countryOfOrigin: record.countryOfOrigin,
      defaultCurrency: record.defaultCurrency,
      settings: this.parseSettings(record.settingsJson),
      tenantId: record.tenantId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async getIdentity(brandId: string, context: BrandAccessContext = {}): Promise<BrandIdentityResponse | null> {
    await this.fetchScopedBrand(brandId, context);
    const identity = await this.repo.findBrandIdentity({
      where: { brandId },
      select: identitySelect,
    });
    return identity ? this.mapIdentity(identity) : null;
  }

  async upsertIdentity(
    brandId: string,
    input: BrandIdentityInput,
    context: BrandAccessContext = {},
  ): Promise<BrandIdentityResponse> {
    const brand = await this.fetchScopedBrand(brandId, context);
    const identity = await this.repo.upsertBrandIdentity({
      where: { brandId },
      update: this.buildIdentityUpdateData(input),
      create: {
        brandId,
        ...this.buildIdentityCreateData(input),
      },
      select: identitySelect,
    });

    await emitBrandIdentityUpdated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.identity.updated", { brandId: brand.id, tenantId: brand.tenantId ?? undefined }, context);
    return this.mapIdentity(identity);
  }

  async refreshIdentityAi(
    brandId: string,
    options?: { forceRegenerate?: boolean },
    context: BrandAccessContext = {},
  ): Promise<BrandAiIdentityResponse> {
    const brand = await this.fetchBrandBaseInfo(brandId, context);
    const [identity, rules, aiConfig] = await Promise.all([
      this.getIdentity(brandId, context),
      this.getRules(brandId, context),
      this.getAiConfig(brandId, context),
    ]);
    const messages: AIMessage[] = [
      {
        role: "system",
        content: "You are the MH-OS brand strategist. Provide concise, safe guidance.",
      },
      {
        role: "user",
        content: buildIdentityPrompt({
          brandName: brand.name,
          slug: brand.slug,
          description: brand.description,
          identity,
          rules,
          aiConfig,
          forceRegenerate: options?.forceRegenerate,
        }),
      },
    ];

    const cacheKey = makeCacheKey("brand:identity:ai", { brandId, force: options?.forceRegenerate });
    const aiResult = await orchestrateAI<{ summary?: string; details?: string }>({
      key: cacheKey,
      messages,
      fallback: () => ({
        summary: `Brand identity summary for ${brand.name}`,
        details: `Summary: ${brand.name} (${brand.slug}) — fallback identity guidance. Emphasize authenticity, clarity, and consistent tone.`,
      }),
    });

    const details = aiResult.result.details?.trim() || aiResult.result.summary?.trim() ||
      "AI identity could not be generated due to configuration or upstream errors.";
    const summary = this.extractSummary(details);

    const promptTokens = estimateTokens(messages);
    const totalTokens = promptTokens; // output tokens unknown; log prompt only
    const costUsd = estimateCostUsd(totalTokens, process.env.AI_MODEL_MHOS ?? "gpt-4-turbo");
    await logExecution({
      runId: cacheKey,
      namespace: "brand.identity",
      agentName: "brand-strategist",
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      status: aiResult.cached ? "SUCCESS" : "SUCCESS",
      promptTokens,
      totalTokens,
      costUsd,
      promptPreview: messages.map((m) => m.content).join("\n").slice(0, 500),
      outputPreview: details.slice(0, 500),
      brandId: brand.id,
      tenantId: brand.tenantId,
      metadata: { cached: aiResult.cached },
    });

    const insight = await this.repo.createAIInsight({
      data: {
        brandId,
        os: "brand",
        entityType: "brand",
        entityId: brandId,
        summary,
        details,
      },
      select: aiInsightSelect,
    });

    logger.info(`[brand] Created identity insight ${insight.id} for brand ${brandId}`);
    await emitBrandIdentityAiGenerated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );

    await recordSafetyEvent({
      type: "SAFETY_CONSTRAINT",
      namespace: "brand.identity",
      agentName: "brand-strategist",
      riskLevel: "LOW",
      decision: "ALLOW",
      detail: { cached: aiResult.cached, forceRegenerate: options?.forceRegenerate },
      brandId: brand.id,
      tenantId: brand.tenantId,
    });
    return {
      id: insight.id,
      summary: insight.summary ?? summary,
      details: insight.details ?? details,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  }

  async refreshRulesConsistency(
    brandId: string,
    options?: { forceRegenerate?: boolean },
    context: BrandAccessContext = {},
  ): Promise<BrandAiIdentityResponse> {
    const brand = await this.fetchBrandBaseInfo(brandId, context);
    const [rules, identity, aiConfig] = await Promise.all([
      this.getRules(brandId, context),
      this.getIdentity(brandId, context),
      this.getAiConfig(brandId, context),
    ]);

    const messages: AIMessage[] = [
      { role: "system", content: "You are the MH-OS compliance reviewer. Stay concise and safe." },
      {
        role: "user",
        content: buildRulesConsistencyPrompt({
          brandName: brand.name,
          slug: brand.slug,
          rules,
          identity,
          aiConfig,
          forceRegenerate: options?.forceRegenerate,
        }),
      },
    ];

    const cacheKey = makeCacheKey("brand:rules:ai", { brandId, force: options?.forceRegenerate });
    const aiResult = await orchestrateAI<{ summary?: string; details?: string }>({
      key: cacheKey,
      messages,
      fallback: () => ({
        summary: `Rules check for ${brand.name}`,
        details: "No AI result available; ensure naming/marketing/discount rules are consistent and avoid restricted words.",
      }),
    });

    const details = aiResult.result.details?.trim() || aiResult.result.summary?.trim() ||
      "AI rules check unavailable.";
    const summary = this.extractSummary(details);

    const promptTokens = estimateTokens(messages);
    const totalTokens = promptTokens;
    const costUsd = estimateCostUsd(totalTokens, process.env.AI_MODEL_MHOS ?? "gpt-4-turbo");
    await logExecution({
      runId: cacheKey,
      namespace: "brand.rules",
      agentName: "brand-compliance",
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      status: aiResult.cached ? "SUCCESS" : "SUCCESS",
      promptTokens,
      totalTokens,
      costUsd,
      promptPreview: messages.map((m) => m.content).join("\n").slice(0, 500),
      outputPreview: details.slice(0, 500),
      brandId: brand.id,
      tenantId: brand.tenantId,
      metadata: { cached: aiResult.cached },
    });

    const insight = await prisma.aIInsight.create({
      data: {
        brandId,
        os: "brand",
        entityType: "brand_rules",
        entityId: brandId,
        summary,
        details,
      },
      select: aiInsightSelect,
    });

    await emitBrandRulesAiGenerated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );

    await recordSafetyEvent({
      type: "SAFETY_CONSTRAINT",
      namespace: "brand.rules",
      agentName: "brand-compliance",
      riskLevel: "LOW",
      decision: "ALLOW",
      detail: { cached: aiResult.cached, forceRegenerate: options?.forceRegenerate },
      brandId: brand.id,
      tenantId: brand.tenantId,
    });

    return {
      id: insight.id,
      summary: insight.summary ?? summary,
      details: insight.details ?? details,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  }

  async getRules(brandId: string, context: BrandAccessContext = {}): Promise<BrandRulesResponse | null> {
    await this.fetchScopedBrand(brandId, context);
    const rules = await this.repo.findBrandRules({ where: { brandId }, select: rulesSelect });
    return rules ? this.mapRules(rules) : null;
  }

  async upsertRules(
    brandId: string,
    input: Partial<BrandRulesResponse>,
    context: BrandAccessContext = {},
  ): Promise<BrandRulesResponse> {
    const brand = await this.fetchScopedBrand(brandId, context);
    const record = await this.repo.upsertBrandRules({
      where: { brandId },
      update: this.buildRulesUpdateData(input),
      create: {
        brandId,
        ...this.buildRulesCreateData(input),
      },
      select: rulesSelect,
    });

    await emitBrandRulesUpdated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.rules.updated", { brandId: brand.id, tenantId: brand.tenantId ?? undefined }, context);
    return this.mapRules(record);
  }

  async getAiConfig(
    brandId: string,
    context: BrandAccessContext = {},
  ): Promise<BrandAIConfigResponse | null> {
    await this.fetchScopedBrand(brandId, context);
    const config = await this.repo.findBrandAIConfig({ where: { brandId }, select: aiConfigSelect });
    return config ? this.mapAiConfig(config) : null;
  }

  async upsertAiConfig(
    brandId: string,
    input: Partial<BrandAIConfigResponse>,
    context: BrandAccessContext = {},
  ): Promise<BrandAIConfigResponse> {
    const brand = await this.fetchScopedBrand(brandId, context);
    const record = await this.repo.upsertBrandAIConfig({
      where: { brandId },
      update: this.buildAiConfigUpdateData(input),
      create: {
        brandId,
        ...this.buildAiConfigCreateData(input),
      },
      select: aiConfigSelect,
    });

    await emitBrandAiConfigUpdated(
      { id: brand.id, name: brand.name },
      { brandId: brand.id, tenantId: brand.tenantId ?? undefined, source: "api" },
    );
    await this.recordActivity("brand.ai_config.updated", { brandId: brand.id, tenantId: brand.tenantId ?? undefined }, context);
    return this.mapAiConfig(record);
  }

  private mapIdentity(
    record: Prisma.BrandIdentityGetPayload<{ select: typeof identitySelect }>,
  ): BrandIdentityResponse {
    return {
      brandId: record.brandId,
      vision: record.vision ?? undefined,
      mission: record.mission ?? undefined,
      values: record.values ?? undefined,
      toneOfVoice: record.toneOfVoice ?? undefined,
      persona: record.persona ?? undefined,
      brandStory: record.brandStory ?? undefined,
      keywords: record.keywords ?? undefined,
      colorPalette: record.colorPalette ?? undefined,
      packagingStyle: record.packagingStyle ?? undefined,
      socialProfiles: this.parseSocialProfiles(record.socialProfilesJson),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapRules(record: Prisma.BrandRulesGetPayload<{ select: typeof rulesSelect }>): BrandRulesResponse {
    return {
      brandId: record.brandId,
      namingRules: record.namingRules,
      descriptionRules: record.descriptionRules,
      marketingRules: record.marketingRules,
      discountRules: record.discountRules,
      pricingConstraints: record.pricingConstraints,
      restrictedWords: record.restrictedWords,
      allowedWords: record.allowedWords,
      aiRestrictions: record.aiRestrictions,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private buildRulesCreateData(input: Partial<BrandRulesResponse>) {
    return {
      namingRules: input.namingRules ?? null,
      descriptionRules: input.descriptionRules ?? null,
      marketingRules: input.marketingRules ?? null,
      discountRules: input.discountRules ?? null,
      pricingConstraints: input.pricingConstraints ?? null,
      restrictedWords: input.restrictedWords ?? null,
      allowedWords: input.allowedWords ?? null,
      aiRestrictions: input.aiRestrictions ?? null,
    } satisfies Omit<Prisma.BrandRulesUncheckedCreateInput, "brandId">;
  }

  private buildRulesUpdateData(input: Partial<BrandRulesResponse>): Prisma.BrandRulesUncheckedUpdateInput {
    const data: Prisma.BrandRulesUncheckedUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(input, "namingRules")) data.namingRules = input.namingRules ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "descriptionRules"))
      data.descriptionRules = input.descriptionRules ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "marketingRules"))
      data.marketingRules = input.marketingRules ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "discountRules")) data.discountRules = input.discountRules ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "pricingConstraints"))
      data.pricingConstraints = input.pricingConstraints ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "restrictedWords"))
      data.restrictedWords = input.restrictedWords ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "allowedWords")) data.allowedWords = input.allowedWords ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "aiRestrictions"))
      data.aiRestrictions = input.aiRestrictions ?? null;

    return data;
  }

  private mapAiConfig(
    record: Prisma.BrandAIConfigGetPayload<{ select: typeof aiConfigSelect }>,
  ): BrandAIConfigResponse {
    return {
      brandId: record.brandId,
      aiPersonality: record.aiPersonality,
      aiTone: record.aiTone,
      aiContentStyle: record.aiContentStyle,
      aiPricingStyle: record.aiPricingStyle,
      aiEnabledActions: this.parseStringArray(record.aiEnabledActionsJson),
      aiBlockedTopics: this.parseStringArray(record.aiBlockedTopicsJson),
      aiModelVersion: record.aiModelVersion,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private buildAiConfigCreateData(input: Partial<BrandAIConfigResponse>) {
    return {
      aiPersonality: input.aiPersonality ?? null,
      aiTone: input.aiTone ?? null,
      aiContentStyle: input.aiContentStyle ?? null,
      aiPricingStyle: input.aiPricingStyle ?? null,
      aiEnabledActionsJson: this.serializeStringArray(input.aiEnabledActions),
      aiBlockedTopicsJson: this.serializeStringArray(input.aiBlockedTopics),
      aiModelVersion: input.aiModelVersion ?? null,
    } satisfies Omit<Prisma.BrandAIConfigUncheckedCreateInput, "brandId">;
  }

  private buildAiConfigUpdateData(
    input: Partial<BrandAIConfigResponse>,
  ): Prisma.BrandAIConfigUncheckedUpdateInput {
    const data: Prisma.BrandAIConfigUncheckedUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(input, "aiPersonality"))
      data.aiPersonality = input.aiPersonality ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "aiTone")) data.aiTone = input.aiTone ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "aiContentStyle"))
      data.aiContentStyle = input.aiContentStyle ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "aiPricingStyle"))
      data.aiPricingStyle = input.aiPricingStyle ?? null;
    if (Object.prototype.hasOwnProperty.call(input, "aiEnabledActions"))
      data.aiEnabledActionsJson = this.serializeStringArray(input.aiEnabledActions);
    if (Object.prototype.hasOwnProperty.call(input, "aiBlockedTopics"))
      data.aiBlockedTopicsJson = this.serializeStringArray(input.aiBlockedTopics);
    if (Object.prototype.hasOwnProperty.call(input, "aiModelVersion"))
      data.aiModelVersion = input.aiModelVersion ?? null;

    return data;
  }

  private buildIdentityCreateData(input: BrandIdentityInput) {
    return {
      vision: input.vision ?? null,
      mission: input.mission ?? null,
      values: input.values ?? null,
      toneOfVoice: input.toneOfVoice ?? null,
      persona: input.persona ?? null,
      brandStory: input.brandStory ?? null,
      keywords: input.keywords ?? null,
      colorPalette: input.colorPalette ?? null,
      packagingStyle: input.packagingStyle ?? null,
      socialProfilesJson: this.serializeSocialProfiles(input.socialProfiles),
    };
  }

  private buildIdentityUpdateData(input: BrandIdentityInput): Prisma.BrandIdentityUncheckedUpdateInput {
    const data: Prisma.BrandIdentityUncheckedUpdateInput = {};

    if (Object.prototype.hasOwnProperty.call(input, "vision")) {
      data.vision = input.vision ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "mission")) {
      data.mission = input.mission ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "values")) {
      data.values = input.values ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "toneOfVoice")) {
      data.toneOfVoice = input.toneOfVoice ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "persona")) {
      data.persona = input.persona ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "brandStory")) {
      data.brandStory = input.brandStory ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "keywords")) {
      data.keywords = input.keywords ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "colorPalette")) {
      data.colorPalette = input.colorPalette ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "packagingStyle")) {
      data.packagingStyle = input.packagingStyle ?? null;
    }
    if (Object.prototype.hasOwnProperty.call(input, "socialProfiles")) {
      data.socialProfilesJson = this.serializeSocialProfiles(input.socialProfiles);
    }

    return data;
  }

  private buildIdentityPrompt(payload: {
    brandName: string;
    slug: string;
    description?: string | null;
    identity?: BrandIdentityResponse | null;
    forceRegenerate?: boolean;
  }) {
    const lines = [
      `Brand: ${payload.brandName} (${payload.slug})`,
      `Description: ${payload.description ?? "Not provided"}`,
      `Vision: ${payload.identity?.vision ?? "Not provided"}`,
      `Mission: ${payload.identity?.mission ?? "Not provided"}`,
      `Tone of Voice: ${payload.identity?.toneOfVoice ?? "Not provided"}`,
      `Persona: ${payload.identity?.persona ?? "Not provided"}`,
      `Keywords: ${payload.identity?.keywords ?? "Not provided"}`,
    ];
    if (payload.forceRegenerate) {
      lines.push("Force regenerate requested: true");
    }
    lines.push(
      "Produce output with 'Summary:' as the first line and 'Details:' followed by a paragraph describing tone guidance and suggested keywords.",
    );
    return lines.join("\n");
  }

  private extractSummary(details: string): string {
    const trimmed = details.trim();
    if (!trimmed) return "Brand identity summary generated by AI.";
    const [firstLine = ""] = trimmed.split("\n");
    return firstLine.replace(/^summary:\s*/i, "").trim() || trimmed;
  }

  private async recordActivity(name: string, payload: Record<string, unknown>, context: BrandAccessContext) {
    const payloadBrandId = typeof payload.brandId === "string" ? payload.brandId : undefined;
    const payloadTenantId = typeof payload.tenantId === "string" ? payload.tenantId : undefined;
    const actorUserId = typeof payload.actorId === "string" ? payload.actorId : undefined;

    const envelope: EventEnvelope = {
      id: randomUUID(),
      name,
      payload,
      occurredAt: new Date(),
      context: {
        brandId: payloadBrandId ?? context.brandId ?? undefined,
        tenantId: payloadTenantId ?? context.tenantId ?? undefined,
        source: "api",
        actorUserId,
        module: "brand",
      },
    };
    await activityLogService.record(envelope);
  }

  private async ensureSlugIsUnique(slug: string) {
    const existing = await this.repo.findBrandBySlug({ where: { slug } });
    if (existing) {
      throw badRequest("Slug already in use");
    }
  }

  private isSuperAdmin(context: BrandAccessContext) {
    return context.role === "SUPER_ADMIN";
  }

  private assertBrandScope(
    brand: Prisma.BrandGetPayload<{ select: typeof brandSelect }>,
    context: BrandAccessContext,
  ) {
    if (this.isSuperAdmin(context)) return;

    if (context.brandId && context.brandId !== brand.id) {
      throw forbidden("Cannot access a brand outside your assignment");
    }

    if (context.tenantId && brand.tenantId && context.tenantId !== brand.tenantId) {
      throw forbidden("Cannot access a brand outside your tenant");
    }
  }

  private resolveTenantForMutation(context: BrandAccessContext, requestedTenantId?: string | null) {
    if (requestedTenantId) {
      if (this.isSuperAdmin(context)) return requestedTenantId;
      if (context.tenantId && context.tenantId === requestedTenantId) return requestedTenantId;
      throw forbidden("Cannot assign brand to another tenant");
    }

    if (context.tenantId) return context.tenantId;
    if (this.isSuperAdmin(context)) return null;

    throw badRequest("Tenant context is required to manage brands");
  }

  private async enforceBrandLimit(tenantId: string | null | undefined, planContext?: PlanContext) {
    if (!tenantId) return;
    const limit = planContext?.features.brandLimit ?? Infinity;
    if (!Number.isFinite(limit)) return;
    const count = await this.repo.countBrands({ where: { tenantId } });
    if (count >= limit) {
      throw badRequest(`Brand limit reached for this plan (max ${limit}).`);
    }
  }

  private async resolveUsers(
    userIds?: string[],
    tenantId?: string | null,
    context: BrandAccessContext = {},
  ) {
    if (!userIds || userIds.length === 0) return undefined;
    if (!tenantId && !this.isSuperAdmin(context)) {
      throw badRequest("Tenant context required to link users to a brand");
    }

    const uniqueIds = Array.from(new Set(userIds));
    const users = await this.repo.findUsers({
      where: {
        id: { in: uniqueIds },
        ...(tenantId ? { tenantId } : {}),
      },
      select: { id: true },
    });
    if (users.length !== uniqueIds.length) {
      throw badRequest("One or more users do not exist in this tenant");
    }
    return uniqueIds;
  }

  private serializeSocialProfiles(value?: Record<string, string> | null): string | null {
    if (!value || Object.keys(value).length === 0) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  private parseSocialProfiles(value?: string | null): Record<string, string> | undefined {
    if (!value) return undefined;
    try {
      return JSON.parse(value) as Record<string, string>;
    } catch {
      return undefined;
    }
  }

  private serializeStringArray(value?: string[] | null): string | null {
    if (!value || value.length === 0) return null;
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  private parseStringArray(value?: string | null): string[] | null {
    if (!value) return null;
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed.filter((v) => typeof v === "string") as string[]) : null;
    } catch {
      return null;
    }
  }

  private async fetchScopedBrand(brandId: string, context: BrandAccessContext) {
    const brand = await this.repo.findBrandById({ where: { id: brandId }, select: brandSelect });
    if (!brand) {
      throw notFound("Brand not found");
    }
    this.assertBrandScope(brand, context);
    return brand;
  }

  private async fetchBrandBaseInfo(brandId: string, context: BrandAccessContext) {
    const brand = await this.fetchScopedBrand(brandId, context);
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      tenantId: brand.tenantId,
    };
  }
}

export const brandService = new BrandService();
