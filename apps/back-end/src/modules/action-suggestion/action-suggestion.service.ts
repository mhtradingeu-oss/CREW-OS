// Service for ActionSuggestion read/query and mapping helpers.
import type { Prisma, PrismaClient } from "@prisma/client";
import {
  AICrewRecommendation,
  PlanIntelligenceInsight,
  PlanIntelligenceInsightJson,
} from "./action-suggestion.types.js";

type SortField = "createdAt";
type SortOrder = Prisma.SortOrder;

export type ActionSuggestionFilters = {
  tenantId?: string;
  brandId?: string;
  partnerId?: string;
  featureCode?: string;
  crew?: string;
  insightType?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  riskLevel?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
  sort?: SortField;
  order?: SortOrder;
};

type LoggerLike = {
  error?(message?: unknown, ...optional: unknown[]): void;
  info?(message?: unknown, ...optional: unknown[]): void;
};

const CATEGORY_WHITELIST = [
  "UPGRADE_SIGNAL",
  "PLAN_MISMATCH",
  "OVERUSE",
  "UNDERUSE",
  "WHITE_LABEL_READY",
  "PARTNER_EXPANSION",
];

function normalizeCategories(json?: PlanIntelligenceInsightJson | null) {
  return Array.isArray(json?.categories) ? json.categories : [];
}

function buildInsightSuggestion(insight: PlanIntelligenceInsight, insightType: string) {
  const crew = insight.insightJson?.crew ?? null;
  const rationale = insight.insightJson?.rationale ?? null;
  const confidence =
    insight.insightJson?.confidenceScore ?? null;
  const riskLevel = insight.insightJson?.riskLevel ?? null;
  return {
    insightId: insight.id,
    recommendationId: null,
    tenantId: insight.tenantId ?? null,
    brandId: insight.brandId ?? null,
    partnerId: insight.partnerId ?? null,
    featureCode: insight.featureCode ?? null,
    insightType,
    crew,
    suggestedAction: insightType,
    rationale,
    confidence,
    riskLevel,
  };
}

function buildRecommendationSuggestion(rec: AICrewRecommendation, action: string) {
  return {
    insightId: null,
    recommendationId: rec.id,
    tenantId: rec.tenantId ?? null,
    brandId: rec.brandId ?? null,
    partnerId: rec.partnerId ?? null,
    featureCode: rec.featureCode ?? null,
    insightType: rec.recommendationType ?? null,
    crew: rec.crew ?? null,
    suggestedAction: action,
    rationale: rec.rationale ?? null,
    confidence: rec.confidence ?? null,
    riskLevel: rec.riskLevel ?? null,
  };
}

export class ActionSuggestionService {
  /**
   * Read-only query for ActionSuggestion records with filters, pagination, and sorting.
   * Never triggers execution, automation, or state changes.
   */
  static async getActionSuggestions({
    filters = {},
    prisma,
    logger = console,
  }: {
    filters?: ActionSuggestionFilters;
    prisma: PrismaClient;
    logger?: LoggerLike;
  }) {
    try {
      const {
        tenantId,
        brandId,
        partnerId,
        featureCode,
        crew,
        insightType,
        confidenceMin,
        confidenceMax,
        riskLevel,
        startDate,
        endDate,
      } = filters;
      const pageNumber = Number(filters?.page ?? 1);
      const pageSizeNumber = Number(filters?.pageSize ?? 20);
      const sortField: SortField = filters?.sort ?? "createdAt";
      const sortOrder: SortOrder = filters?.order ?? "desc";

      const where: Prisma.ActionSuggestionWhereInput = {};
      if (tenantId) where.tenantId = tenantId;
      if (brandId) where.brandId = brandId;
      if (partnerId) where.partnerId = partnerId;
      if (featureCode) where.featureCode = featureCode;
      if (crew) where.crew = crew;
      if (insightType) where.insightType = insightType;
      if (riskLevel) where.riskLevel = riskLevel;
      if (confidenceMin !== undefined || confidenceMax !== undefined) {
        const confidenceFilter: Prisma.FloatNullableFilter = {};
        if (confidenceMin !== undefined) confidenceFilter.gte = confidenceMin;
        if (confidenceMax !== undefined) confidenceFilter.lte = confidenceMax;
        where.confidence = confidenceFilter;
      }
      if (startDate || endDate) {
        const createdAtFilter: Prisma.DateTimeFilter = {};
        if (startDate) createdAtFilter.gte = new Date(startDate);
        if (endDate) createdAtFilter.lte = new Date(endDate);
        where.createdAt = createdAtFilter;
      }

      const skip = (pageNumber - 1) * pageSizeNumber;
      const [data, total] = await Promise.all([
        prisma.actionSuggestion.findMany({
          where,
          orderBy: { [sortField]: sortOrder },
          skip,
          take: pageSizeNumber,
        }),
        prisma.actionSuggestion.count({ where }),
      ]);
      return {
        data,
        total,
        page: pageNumber,
        pageSize: pageSizeNumber,
      };
    } catch (err) {
      logger.error?.("[ActionSuggestion] getActionSuggestions error", err);
      return { data: [], total: 0, page: 1, pageSize: 20 };
    }
  }

  /**
   * Map PlanIntelligenceInsight and AICrewRecommendation to ActionSuggestion DB records.
   * Idempotent, async-safe, fail-silent. No side effects.
   */
  static async mapAndStoreSuggestions({
    insights,
    recommendations,
    prisma,
    logger = console,
  }: {
    insights: PlanIntelligenceInsight[];
    recommendations: AICrewRecommendation[];
    prisma: PrismaClient;
    logger?: LoggerLike;
  }) {
    for (const insight of insights) {
      try {
        const categories = normalizeCategories(insight.insightJson);
        const eligible = categories.filter((cat) => CATEGORY_WHITELIST.includes(cat));

        for (const cat of eligible) {
          const where = {
            insightId: insight.id,
            suggestedAction: cat,
          };
          const exists = await prisma.actionSuggestion.findFirst({ where });
          if (exists) continue;

          const suggestion = buildInsightSuggestion(insight, cat);
          await prisma.actionSuggestion.create({ data: suggestion });
          logger.info?.(
            `[ActionSuggestion] Created for PlanIntelligenceInsight ${insight.id} (${cat})`,
          );
        }
      } catch (err) {
        logger.error?.("[ActionSuggestion] PlanIntelligenceInsight mapping error", err);
      }
    }

    for (const rec of recommendations) {
      try {
        const recType = rec.recommendationType ?? "growth";
        if (!["growth", "operational", "strategic"].includes(recType)) continue;
        const where = {
          recommendationId: rec.id,
          suggestedAction: recType,
        };
        const exists = await prisma.actionSuggestion.findFirst({ where });
        if (exists) continue;
        const suggestion = buildRecommendationSuggestion(rec, recType);
        await prisma.actionSuggestion.create({ data: suggestion });
        logger.info?.(
          `[ActionSuggestion] Created for AICrewRecommendation ${rec.id} (${recType})`,
        );
      } catch (err) {
        logger.error?.("[ActionSuggestion] AICrewRecommendation mapping error", err);
      }
    }
  }
}
