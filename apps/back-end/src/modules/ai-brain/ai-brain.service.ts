/**
 * AI BRAIN — MH-OS v2
 * Spec: docs/os/24_ai-brain-os.md
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import type { AIMessage } from "../../core/ai-service/ai-client.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";
import { aiOrchestrator, orchestrateAI, makeCacheKey } from "../../core/ai/orchestrator.js";
import { insightsPrompt } from "../../core/ai/prompt-templates.js";
import { pricingInsightTemplate } from "../../core/ai/prompt-templates.js";
import { aiInsightsService } from "./ai-insights.service.js";
import {
  AIInsightDTO,
  AILearningLogDTO,
  CreateAiBrainInput,
  CreateInsightInput,
  CreateLearningLogInput,
  CreateReportInput,
  InsightListParams,
  InsightListResponse,
  KpiNarrativeOutput,
  LearningListParams,
  LearningListResponse,
  ReportListParams,
  ReportListResponse,
  UpdateAiBrainInput,
  AIReportDTO,
} from "./ai-brain.types.js";
import {
  emitAiBrainCreated,
  emitAiBrainUpdated,
  emitAiBrainDeleted,
} from "./ai-brain.events.js";

const insightSelect = {
  id: true,
  brandId: true,
  os: true,
  entityType: true,
  entityId: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

const reportSelect = {
  id: true,
  brandId: true,
  title: true,
  scope: true,
  periodStart: true,
  periodEnd: true,
  content: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIReportSelect;

const learningSelect = {
  id: true,
  brandId: true,
  productId: true,
  source: true,
  eventType: true,
  inputSnapshotJson: true,
  outputSnapshotJson: true,
  createdAt: true,
} satisfies Prisma.AILearningJournalSelect;

function mapInsight(record: Prisma.AIInsightGetPayload<{ select: typeof insightSelect }>): AIInsightDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    os: record.os ?? undefined,
    entityType: record.entityType ?? undefined,
    entityId: record.entityId ?? undefined,
    summary: record.summary ?? undefined,
    details: record.details ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapReport(record: Prisma.AIReportGetPayload<{ select: typeof reportSelect }>): AIReportDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    title: record.title,
    scope: record.scope ?? undefined,
    periodStart: record.periodStart ?? undefined,
    periodEnd: record.periodEnd ?? undefined,
    content: record.content ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapLearning(record: Prisma.AILearningJournalGetPayload<{ select: typeof learningSelect }>): AILearningLogDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    productId: record.productId ?? undefined,
    source: record.source ?? undefined,
    eventType: record.eventType ?? undefined,
    inputSnapshot: record.inputSnapshotJson ? JSON.parse(record.inputSnapshotJson) : undefined,
    outputSnapshot: record.outputSnapshotJson ? JSON.parse(record.outputSnapshotJson) : undefined,
    createdAt: record.createdAt,
  };
}

function buildInsightPrompt(input: CreateInsightInput) {
  const lines = [
    `Brand: ${input.brandId}`,
    `OS: ${input.os ?? "general"}`,
    `Entity Type: ${input.entityType ?? "general"}`,
    `Entity ID: ${input.entityId ?? "unspecified"}`,
    `Existing Summary: ${input.summary ?? "none"}`,
    `Existing Details: ${input.details ?? "none"}`,
    "Please craft a concise summary and detailed explanation for this insight.",
  ];
  return lines.join("\n");
}

type AiBrainListParams = {
  brandId?: string;
  includeAnalysis?: boolean;
};

type BrandAnalysis = {
  brandId: string;
  analysis?: KpiNarrativeOutput;
  lastAnalysisAt?: Date;
};

type AiBrainOverview = {
  brandId: string;
  brandName?: string;
  brandSlug?: string;
  insightCount: number;
  reportCount: number;
  learningCount: number;
  lastInsightAt?: Date;
  lastReportAt?: Date;
  lastLearningAt?: Date;
  lastAnalysisAt?: Date;
  analysis?: KpiNarrativeOutput;
};

type AiBrainInsightResult = AIInsightDTO & {
  analysis?: KpiNarrativeOutput;
  lastAnalysisAt?: Date;
};

export const ai_brainService = {
  async list(params: AiBrainListParams = {}): Promise<AiBrainOverview[]> {
    const brands = await prisma.brand.findMany({
      where: params.brandId ? { id: params.brandId } : undefined,
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
    if (!brands.length) return [];

    const brandIds = brands.map((brand) => brand.id);
    const [insightGroups, reportGroups, learningGroups] = await prisma.$transaction([
      prisma.aIInsight.groupBy({
        by: ["brandId"],
        where: { brandId: { in: brandIds } },
        orderBy: { brandId: "asc" },
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
      prisma.aIReport.groupBy({
        by: ["brandId"],
        where: { brandId: { in: brandIds } },
        orderBy: { brandId: "asc" },
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
      prisma.aILearningJournal.groupBy({
        by: ["brandId"],
        where: { brandId: { in: brandIds } },
        orderBy: { brandId: "asc" },
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
    ]);

    const insightMap = buildCountMap(insightGroups);
    const reportMap = buildCountMap(reportGroups);
    const learningMap = buildCountMap(learningGroups);

    let analysisData: BrandAnalysis | undefined;
    const includeAnalysis =
      Boolean(params.includeAnalysis) && Boolean(params.brandId) && brandIds.length === 1;
    if (includeAnalysis && params.brandId) {
      analysisData = await generateBrandAnalysis(params.brandId, undefined);
    }

    return brands.map((brand) => {
      const overview: AiBrainOverview = {
        brandId: brand.id,
        brandName: brand.name,
        brandSlug: brand.slug ?? undefined,
        insightCount: insightMap.get(brand.id)?.total ?? 0,
        reportCount: reportMap.get(brand.id)?.total ?? 0,
        learningCount: learningMap.get(brand.id)?.total ?? 0,
        lastInsightAt: insightMap.get(brand.id)?.lastUpdated ?? undefined,
        lastReportAt: reportMap.get(brand.id)?.lastUpdated ?? undefined,
        lastLearningAt: learningMap.get(brand.id)?.lastUpdated ?? undefined,
      };
      if (analysisData && analysisData.brandId === brand.id && analysisData.analysis) {
        overview.analysis = analysisData.analysis;
        overview.lastAnalysisAt = analysisData.lastAnalysisAt;
      }
      return overview;
    });
  },

  async getById(id: string): Promise<AiBrainOverview> {
    const items = await this.list({ brandId: id, includeAnalysis: true });
    const best = items[0];
    if (!best) {
      throw notFound("Brand not found");
    }
    return best;
  },

  async create(input: CreateAiBrainInput): Promise<AiBrainInsightResult> {
    if (!input.brandId) {
      throw badRequest("brandId is required");
    }

    const brand = await fetchBrand(input.brandId);
    await aiInsightsService.refresh({ brandId: brand.id, scope: input.scope });
    const analysis = await generateBrandAnalysis(brand.id, input.metrics);
    const summary = input.summary ?? analysis?.analysis?.overview ?? `${brand.name} AI Brain summary`;
    const details = JSON.stringify({
      analysis: analysis?.analysis ?? {},
      highlights: input.highlights ?? [],
      notes: input.notes ?? null,
    });

    const created = await prisma.aIInsight.create({
      data: {
        brandId: brand.id,
        os: "ai-brain",
        entityType: "brain-summary",
        entityId: input.scope ?? "summary",
        summary,
        details,
      },
      select: insightSelect,
    });

    if (input.createReport) {
      await aiInsightsService.createReport({
        brandId: brand.id,
        title: `AI Brain report ${new Date().toISOString()}`,
        scope: input.scope,
      });
    }

    await emitAiBrainCreated({ id: created.id }, { brandId: brand.id });
    return enrichInsight(created, analysis);
  },

  async update(id: string, input: UpdateAiBrainInput): Promise<AiBrainInsightResult> {
    const existing = await prisma.aIInsight.findUnique({ where: { id } });
    if (!existing) {
      throw notFound("Insight not found");
    }

    const brandId = input.brandId ?? existing.brandId;
    if (!brandId) {
      throw badRequest("Insight requires a brand");
    }

    const brand = await fetchBrand(brandId);
    await aiInsightsService.refresh({
      brandId: brand.id,
      scope: input.scope ?? existing.entityId ?? undefined,
    });
    const analysis = await generateBrandAnalysis(brand.id, input.metrics);
    const summary = input.summary ?? analysis?.analysis?.overview ?? existing.summary ?? `${brand.name} AI summary`;
    const detailsPayload = {
      analysis: analysis?.analysis ?? {},
      highlights: input.highlights ?? [],
      notes: input.notes ?? null,
    };

    const updated = await prisma.aIInsight.update({
      where: { id },
      data: {
        brandId: brand.id,
        os: "ai-brain",
        entityType: "brain-summary",
        entityId: input.scope ?? existing.entityId ?? "summary",
        summary,
        details: JSON.stringify(detailsPayload),
      },
      select: insightSelect,
    });

    await emitAiBrainUpdated({ id }, { brandId: brand.id });
    return enrichInsight(updated, analysis);
  },

  async remove(id: string) {
    const existing = await prisma.aIInsight.findUnique({
      where: { id },
      select: { id: true, brandId: true },
    });
    if (!existing) {
      throw notFound("Insight not found");
    }
    await prisma.aIInsight.delete({ where: { id } });
    await emitAiBrainDeleted({ id }, { brandId: existing.brandId ?? undefined });
    return { id };
  },
};

async function fetchBrand(brandId: string) {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, name: true, slug: true },
  });
  if (!brand) {
    throw notFound("Brand not found");
  }
  return brand;
}

function buildCountMap(
  groups: Array<{ brandId: string | null; _count?: any; _max?: { updatedAt?: Date | null } }>
) {
  const map = new Map<
    string | null,
    { total: number; lastUpdated: Date | null }
  >();

  for (const g of groups) {
    const key = g.brandId ?? null;
    const count =
      typeof g._count === "object" && g._count?._all != null
        ? Number(g._count._all)
        : 0;

    const last =
      g._max && g._max.updatedAt ? g._max.updatedAt : null;

    map.set(key, { total: count, lastUpdated: last });
  }

  return map;
}

async function generateBrandAnalysis(brandId: string, metrics?: Record<string, unknown>): Promise<BrandAnalysis> {
  try {
    const response = await aiOrchestrator.generateKpiNarrativeTyped({
      brandId,
      metrics,
    });
    return {
      brandId,
      analysis: response.result,
      lastAnalysisAt: new Date(),
    };
  } catch (err) {
    logger.error("[ai-brain] analysis generation failed", { error: err });
    return { brandId };
  }
}

function enrichInsight(insight: Prisma.AIInsightGetPayload<{ select: typeof insightSelect }>, analysis?: { analysis?: KpiNarrativeOutput; lastAnalysisAt?: Date }) {
  const base = mapInsight(insight);
  if (analysis?.analysis) {
    return {
      ...base,
      analysis: analysis.analysis,
      lastAnalysisAt: analysis.lastAnalysisAt,
    };
  }
  return base;
}

export const aiBrainInsightsService = {
  async listInsights(params: InsightListParams): Promise<InsightListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { brandId, os, entityType, entityId, search, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.AIInsightWhereInput = { brandId };
    if (os) where.os = os;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (search) {
      where.OR = [
        { summary: { contains: search, mode: "insensitive" } },
        { details: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await prisma.$transaction([
      prisma.aIInsight.count({ where }),
      prisma.aIInsight.findMany({
        where,
        select: insightSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(mapInsight),
      total,
      page,
      pageSize: take,
    };
  },

  async createInsight(input: CreateInsightInput): Promise<AIInsightDTO> {
    if (!input.brandId) {
      throw badRequest("brandId is required");
    }

    const needGeneration = !input.summary && !input.details;
    let generatedText = "";
    if (needGeneration) {
      const prompt = buildInsightPrompt(input);
      const messages: AIMessage[] = [
        {
          role: "system",
          content: "You are the MH-OS AI Brain. Provide concise yet informative insights.",
        },
        { role: "user", content: prompt },
      ];
      const model = process.env.AI_MODEL_MHOS ?? "gpt-4-turbo";
      const response = await runAIRequest({ model, messages });
      generatedText = response.success ? response.content : "AI insight could not be generated.";
    }

    const summary = input.summary ?? generatedText.split("\n")[0] ?? "AI-generated insight";
    const details = input.details ?? generatedText;

    const created = await prisma.aIInsight.create({
      data: {
        brandId: input.brandId,
        os: input.os ?? null,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        summary,
        details,
      },
      select: insightSelect,
    });

    logger.info(`[ai-brain] Created insight ${created.id} for brand ${input.brandId}`);
    return mapInsight(created);
  },

  async listReports(params: ReportListParams): Promise<ReportListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { brandId, scope, periodStart, periodEnd, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: Prisma.AIReportWhereInput = { brandId };
    if (scope) where.scope = scope;
    if (periodStart || periodEnd) {
      where.periodStart = {};
      if (periodStart) where.periodStart.gte = periodStart;
      if (periodEnd) where.periodStart.lte = periodEnd;
    }

    const [total, rows] = await prisma.$transaction([
      prisma.aIReport.count({ where }),
      prisma.aIReport.findMany({
        where,
        select: reportSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(mapReport),
      total,
      page,
      pageSize: take,
    };
  },

  async createReport(input: CreateReportInput): Promise<AIReportDTO> {
    if (!input.brandId) {
      throw badRequest("brandId is required");
    }

    const messages: AIMessage[] = [
      {
        role: "system",
        content: "You are an AI analyst drafting biweekly reports for MH-OS.",
      },
      {
        role: "user",
        content: `Brand: ${input.brandId}\nScope: ${input.scope ?? "general"}\nPeriod: ${input.periodStart ?? "start"} – ${input.periodEnd ?? "end"}\nMeta: ${JSON.stringify(
          input.meta ?? {},
        )}`,
      },
    ];

    const response = await runAIRequest({
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      messages,
    });

    const content = input.content ?? response.content ?? "";

    const created = await prisma.aIReport.create({
      data: {
        brandId: input.brandId,
        title: input.title,
        scope: input.scope ?? null,
        periodStart: input.periodStart ?? null,
        periodEnd: input.periodEnd ?? null,
        content,
      },
      select: reportSelect,
    });

    logger.info(`[ai-brain] Created report ${created.id} for brand ${input.brandId}`);

    return mapReport(created);
  },

  async listLearningLogs(params: LearningListParams): Promise<LearningListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { brandId, productId, eventType, source, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.AILearningJournalWhereInput = { brandId };
    if (productId) where.productId = productId;
    if (eventType) where.eventType = eventType;
    if (source) where.source = source;

    const [total, rows] = await prisma.$transaction([
      prisma.aILearningJournal.count({ where }),
      prisma.aILearningJournal.findMany({
        where,
        select: learningSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(mapLearning),
      total,
      page,
      pageSize: take,
    };
  },

  async createLearningLog(input: CreateLearningLogInput): Promise<AILearningLogDTO> {
    if (!input.brandId) {
      throw badRequest("brandId is required");
    }

    const saved = await prisma.aILearningJournal.create({
      data: {
        brandId: input.brandId,
        productId: input.productId ?? null,
        source: input.source,
        eventType: input.eventType,
        inputSnapshotJson: input.inputSnapshot ? JSON.stringify(input.inputSnapshot) : null,
        outputSnapshotJson: input.outputSnapshot ? JSON.stringify(input.outputSnapshot) : null,
      },
      select: learningSelect,
    });

    logger.info(`[ai-brain] Logged learning event ${saved.id} (${input.eventType})`);
    return mapLearning(saved);
  },

  async summarize(payload: { brandName: string; highlights: string; brandId?: string; tenantId?: string }) {
    const prompt = insightsPrompt(payload);
    const cacheKey = makeCacheKey("ai-insights", {
      ...payload,
      brandId: payload.brandId,
      tenantId: payload.tenantId,
    });
    const response = await orchestrateAI({
      key: cacheKey,
      messages: [{ role: "user", content: prompt }],
      fallback: () => ({
        pricingHealth: "Stable",
        marketingSummary: "No AI available, using fallback",
        inventoryRisk: "Unknown",
        nextActions: ["Review pricing weekly", "Launch one campaign"],
      }),
    });
    return response.result;
  },
};
