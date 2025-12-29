/**
 * PRICING ENGINE — MH-OS v2
 * Spec: docs/os/08_pricing-master.md, docs/ai/25_pricing-engine-os.md
 */

/**
 * PRICING SERVICE — MH-OS v2
 * Spec: docs/os/08_pricing-master.md + docs/ai/25_pricing-engine-os.md (MASTER_INDEX)
 */
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { orchestrateAI, makeCacheKey } from "../../core/ai/orchestrator.js";
import { pricingSuggestionPrompt } from "../../core/ai/prompt-templates.js";
import { recordMonitoringEvent } from "../../core/ai/ai-monitoring.js";
import {
  emitCompetitorPriceRecorded,
  emitPricingCreated,
  emitPricingDeleted,
  emitPricingDraftApproved,
  emitPricingDraftCreated,
  emitPricingDraftPendingApproval,
  emitPricingDraftRejected,
  emitPricingLogRecorded,
  emitPricingUpdated,
  emitPricingAISuggested,
  emitPricingPlanGenerated,
} from "./pricing.events.js";
import {
  PRICING_INSIGHT_ENTITY,
  PricingPayload,
  PricingDraftPayload,
  CompetitorPricePayload,
  PricingCreateInput,
  PricingUpdateInput,
  DraftUpdateInput,
  listPricingRecords,
  findPricingById,
  findPricingByProductId,
  createPricingRecord,
  updatePricingRecord,
  deletePricingRecord,
  syncPricingFromDraft,
  createDraftEntry,
  listDraftsByProduct,
  findDraftByProduct,
  updateDraftStatus as updateDraftStatusRecord,
  createCompetitorPriceRecord,
  listCompetitorPrices as listCompetitorPriceRecords,
  createPricingHistoryEntry,
  listPricingHistory,
  createAIInsightEntry,
  listAIInsights,
  createLearningJournalEntry,
  getProductCost,
  findProductWithBrand,
  findBrandById,
  ensureBrandHasCurrency,
  getProductWithPricing,
} from "../../core/db/repositories/pricing.repository.js";
import type { EventContext } from "../../core/events/event-bus.js";
import type {
  CreatePricingDTO,
  UpdatePricingDTO,
  AIPricingRequestDTO,
  PricingRecord,
  PricingDraft,
  AIPricingSuggestion,
  PricingSuggestionInput,
} from "./pricing.types.js";

export type PricingActionContext = {
  brandId?: string;
  actorUserId?: string;
  tenantId?: string;
};

function buildEventContext(context?: PricingActionContext): EventContext {
  return {
    brandId: context?.brandId ?? undefined,
    tenantId: context?.tenantId ?? undefined,
    actorUserId: context?.actorUserId ?? undefined,
    source: "api",
  };
}

const DEFAULT_CURRENCY = "EUR";
const AI_AGENT_NAME = "pricing-ai";
const AI_PLAN_AGENT_NAME = "pricing-strategist";

type RawPricingSuggestion = {
  suggestedPrice: number | null;
  reasoning: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  competitorSummary?: string;
  confidenceScore?: number;
  currentNet?: number | null;
  strategy?: string | null;
  market?: string;
  competitors?: Array<{ name: string; price: number }>;
};

type DraftJsonPayload = Record<string, unknown>;

const DraftStatus = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

function minNonNull(values: Array<number | null | undefined>): number | null {
  const filtered = values.filter((v) => v !== null && v !== undefined) as number[];
  return filtered.length ? Math.min(...filtered) : null;
}

function clampToCostFloor(payload: RawPricingSuggestion, costFloor: number | null) {
  if (costFloor === null) return payload;
  if (payload.suggestedPrice === null) return payload;
  if (payload.suggestedPrice >= costFloor) return payload;
  const clamped: RawPricingSuggestion = {
    ...payload,
    suggestedPrice: costFloor,
    riskLevel: "HIGH",
    reasoning: `${payload.reasoning} (Clamped to cost floor)`,
  };
  return clamped;
}

function decimalToNullableNumber(value?: unknown | null): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function decimalToNumber(value?: unknown | null, fallback = 0) {
  if (value === null || value === undefined) return fallback;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeMargin(basePrice: number, cost: number) {
  return basePrice - cost;
}

function assertNonNegativeMargin(basePrice?: number | null, cost?: number | null) {
  if (basePrice === undefined || basePrice === null) return;
  if (cost === undefined || cost === null) return;
  if (basePrice < cost) {
    throw badRequest("Base price cannot be below cost", { basePrice, cost }, "PRICING_BELOW_COST");
  }
}

function mapPricing(record: PricingPayload, overrides?: Partial<PricingRecord>): PricingRecord {
  const basePrice = decimalToNumber(record.b2cNet);
  const cost = decimalToNumber(record.cogsEur);
  const mapped: PricingRecord = {
    id: record.id,
    productId: record.productId,
    basePrice,
    cost,
    margin: computeMargin(basePrice, cost),
    currency: record.brand?.defaultCurrency ?? DEFAULT_CURRENCY,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
  if (overrides?.notes !== undefined) {
    mapped.notes = overrides.notes;
  }
  return mapped;
}

function mapDraft(record: PricingDraftPayload): PricingDraft {
  return {
    id: record.id,
    productId: record.productId,
    brandId: record.brandId ?? undefined,
    status: record.status ?? undefined,
    statusReason: record.statusReason ?? undefined,
    channel: record.channel ?? undefined,
    oldNet: decimalToNullableNumber(record.oldNet),
    newNet: decimalToNullableNumber(record.newNet),
    createdById: record.createdById ?? undefined,
    approvedById: record.approvedById ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapCompetitorPrice(record: CompetitorPricePayload) {
  return {
    id: record.id,
    productId: record.productId,
    brandId: record.brandId ?? undefined,
    competitor: record.competitor,
    marketplace: record.marketplace ?? undefined,
    country: record.country ?? undefined,
    priceNet: decimalToNullableNumber(record.priceNet),
    priceGross: decimalToNullableNumber(record.priceGross),
    currency: record.currency ?? undefined,
    collectedAt: record.collectedAt ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

type CompetitorPricingDto = ReturnType<typeof mapCompetitorPrice>;
type PricingLogDto = {
  id: string;
  productId: string;
  brandId?: string;
  channel?: string;
  oldNet: number | null;
  newNet: number | null;
  aiAgent?: string;
  confidenceScore: number | null;
  summary?: string;
  createdAt: Date;
};

function parseInsightDetails(value?: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function normalizeNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function ensureCurrencyForBrand(brandId: string | null | undefined, currency?: string) {
  if (!brandId || !currency) return;
  await ensureBrandHasCurrency(brandId, currency);
}

async function ensureProductExists(productId: string, brandId?: string) {
  const product = await findProductWithBrand(productId);
  if (!product) {
    throw badRequest("Product not found");
  }
  if (brandId && product.brandId && product.brandId !== brandId) {
    throw forbidden("Access denied for this brand");
  }
  return product;
}

async function ensureBrandExists(brandId: string) {
  const brand = await findBrandById(brandId);
  if (!brand) {
    throw badRequest("Brand not found");
  }
}

async function recordHistory(
  productId: string,
  brandId: string | undefined,
  channel: string | null,
  oldNet: number | null,
  newNet: number | null,
  summary: string,
  context?: PricingActionContext,
  options?: { aiAgent?: string | null; confidenceScore?: number | null },
) {
  const log = await createPricingHistoryEntry({
    productId,
    brandId,
    channel,
    oldNet,
    newNet,
    aiAgent: options?.aiAgent,
    confidenceScore: options?.confidenceScore,
    summary,
  });
  await emitPricingLogRecorded(
    { id: log.id, productId: log.productId, brandId: log.brandId ?? undefined },
    { ...buildEventContext(context), brandId: log.brandId ?? undefined },
  );
}

async function logPricingInsight(
  productId: string,
  brandId: string | undefined,
  payload: RawPricingSuggestion,
) {
  const insight = await createAIInsightEntry({
    brandId: brandId ?? null,
    os: "pricing",
    entityType: PRICING_INSIGHT_ENTITY,
    entityId: productId,
    summary: `Pricing suggestion ${payload.riskLevel ?? "unknown"}`,
    details: JSON.stringify(payload),
  });
  return insight;
}

function buildPricingCreateData(
  input: CreatePricingDTO,
  brandId: string | null | undefined,
): PricingCreateInput {
  return {
    productId: input.productId,
    brandId: brandId ?? undefined,
    cogsEur: input.cost,
    fullCostEur: input.cost,
    b2cNet: input.basePrice,
  };
}

function buildPricingUpdateData(input: UpdatePricingDTO): PricingUpdateInput {
  const data: PricingUpdateInput = {};
  if (input.basePrice !== undefined) {
    data.b2cNet = input.basePrice;
  }
  if (input.cost !== undefined) {
    data.cogsEur = input.cost;
    data.fullCostEur = input.cost;
  }
  return data;
}

async function listPricing(
  params: { productId?: string; brandId?: string; page?: number; pageSize?: number } = {},
  context?: PricingActionContext,
): Promise<{ data: PricingRecord[]; total: number; page: number; pageSize: number }> {
  const { productId, brandId: requestedBrandId } = params;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  const brandId = context?.brandId ?? requestedBrandId;
  const [total, records] = await listPricingRecords(
    { productId, brandId: brandId ?? undefined },
    { skip, take },
  );

  return { data: records.map((record) => mapPricing(record)), total, page, pageSize: take };
}

async function getPricingById(
  id: string,
  context?: PricingActionContext,
): Promise<PricingRecord> {
  const record = await findPricingById(id);
  if (!record) {
    throw notFound("Pricing not found");
  }
  if (context?.brandId && record.brandId && record.brandId !== context.brandId) {
    throw forbidden("Access denied for this brand");
  }
  return mapPricing(record);
}

async function createPricing(input: CreatePricingDTO, context?: PricingActionContext): Promise<PricingRecord> {
  const product = await ensureProductExists(input.productId, context?.brandId);
  const eventContext = buildEventContext({
    brandId: context?.brandId ?? product.brandId ?? undefined,
    actorUserId: context?.actorUserId,
  });
  const existing = await findPricingByProductId(input.productId);
  if (existing) {
    throw badRequest("Pricing already exists for this product");
  }

  await ensureCurrencyForBrand(product.brandId, input.currency);
  assertNonNegativeMargin(input.basePrice, input.cost);

  const created = await createPricingRecord(buildPricingCreateData(input, product.brandId));

  await emitPricingCreated(
    { id: created.id, productId: created.productId, brandId: created.brandId ?? undefined },
    { ...eventContext, brandId: created.brandId ?? undefined },
  );
  await recordHistory(
    created.productId,
    created.brandId ?? undefined,
    "base",
    null,
    decimalToNullableNumber(created.b2cNet),
    "Pricing created",
    context,
  );

  const result = mapPricing(created);
  if (input.notes) {
    result.notes = input.notes;
  }
  return result;
}

async function updatePricing(
  id: string,
  input: UpdatePricingDTO,
  context?: PricingActionContext,
): Promise<PricingRecord> {
  const existing = await findPricingById(id);
  if (!existing) {
    throw notFound("Pricing not found");
  }
  if (input.priceId && input.priceId !== id) {
    throw badRequest("Pricing payload id mismatch");
  }

  await ensureCurrencyForBrand(existing.brandId, input.currency);
  await ensureProductExists(existing.productId, context?.brandId);
  const eventContext = buildEventContext({
    brandId: context?.brandId ?? existing.brandId ?? undefined,
    actorUserId: context?.actorUserId,
  });

  const targetPrice = input.basePrice ?? decimalToNumber(existing.b2cNet);
  const targetCost = input.cost ?? decimalToNumber(existing.cogsEur);
  assertNonNegativeMargin(targetPrice, targetCost);

  const updateData = buildPricingUpdateData(input);
  if (!Object.keys(updateData).length) {
    const fallback = mapPricing(existing);
    if (input.notes) {
      fallback.notes = input.notes;
    }
    return fallback;
  }

  const updated = await updatePricingRecord(id, updateData);

  await emitPricingUpdated(
    { id: updated.id, productId: updated.productId, brandId: updated.brandId ?? undefined },
    { ...eventContext, brandId: updated.brandId ?? undefined },
  );
  await recordHistory(
    updated.productId,
    updated.brandId ?? undefined,
    "base",
    decimalToNullableNumber(existing.b2cNet),
    decimalToNullableNumber(updated.b2cNet),
    "Pricing updated",
    context,
  );

  const result = mapPricing(updated);
  if (input.notes) {
    result.notes = input.notes;
  }
  return result;
}

async function deletePricing(id: string, context?: PricingActionContext): Promise<{ id: string }> {
  const existing = await findPricingById(id);
  if (!existing) {
    throw notFound("Pricing not found");
  }
  await ensureProductExists(existing.productId, context?.brandId);
  await deletePricingRecord(id);
  const eventContext = buildEventContext({
    brandId: context?.brandId ?? existing.brandId ?? undefined,
    actorUserId: context?.actorUserId,
  });
  await emitPricingDeleted(
    { id, productId: existing.productId, brandId: existing.brandId ?? undefined },
    { ...eventContext, brandId: existing.brandId ?? undefined },
  );
  return { id };
}

async function createDraft(
  productId: string,
  payload: DraftJsonPayload = {},
  context?: PricingActionContext,
): Promise<PricingDraft> {
  return persistDraftEntry(
    {
      productId,
      draftJson: payload,
      createdById: context?.actorUserId ?? undefined,
    },
    context,
  );
}

async function persistDraftEntry(
  input: {
    productId: string;
    draftJson: DraftJsonPayload;
    createdById?: string | null;
  },
  context?: PricingActionContext,
): Promise<PricingDraft> {
  const product = await ensureProductExists(input.productId, context?.brandId);
  const brandId = (input.draftJson.brandId as string | undefined) ?? product.brandId ?? undefined;
  if (brandId) {
    await ensureBrandExists(brandId);
  }
  const normalizedStatus = String(input.draftJson.status ?? DraftStatus.DRAFT).toUpperCase();
  const statusReason =
    typeof input.draftJson.statusReason === "string" ? input.draftJson.statusReason : null;
  const normalizedNewNet = normalizeNumber(input.draftJson.newNet);
  const normalizedOldNet = normalizeNumber(input.draftJson.oldNet);

  const productCost = await getProductCost(product.id);
  assertNonNegativeMargin(normalizedNewNet ?? undefined, productCost ?? undefined);

  const draft = await createDraftEntry({
    productId: input.productId,
    brandId,
    channel: String(input.draftJson.channel ?? "pricing"),
    oldNet: normalizedOldNet,
    newNet: normalizedNewNet,
    status: normalizedStatus,
    statusReason,
    createdById:
      input.createdById ??
      (typeof input.draftJson.createdById === "string" ? input.draftJson.createdById : undefined),
    approvedById:
      typeof input.draftJson.approvedById === "string" ? input.draftJson.approvedById : undefined,
  });

  const eventContext = buildEventContext(context);
  await emitPricingDraftCreated(
    { id: draft.id, productId: draft.productId, brandId: draft.brandId ?? undefined },
    { ...eventContext, brandId: draft.brandId ?? undefined },
  );
  return mapDraft(draft);
}

async function listDrafts(
  productId: string,
  params: { page?: number; pageSize?: number } = {},
  context?: PricingActionContext,
): Promise<{ data: PricingDraft[]; total: number; page: number; pageSize: number }> {
  await ensureProductExists(productId, context?.brandId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  const [total, drafts] = await listDraftsByProduct(productId, { skip, take });
  return { data: drafts.map((draft) => mapDraft(draft)), total, page, pageSize: take };
}

async function submitDraftForApproval(
  productId: string,
  draftId: string,
  context?: PricingActionContext,
): Promise<PricingDraft> {
  return updateDraftStatus(
    productId,
    draftId,
    DraftStatus.PENDING_APPROVAL,
    { approvedById: null, statusReason: null },
    context,
  );
}

async function rejectDraft(
  productId: string,
  draftId: string,
  reason?: string,
  context?: PricingActionContext,
): Promise<PricingDraft> {
  return updateDraftStatus(
    productId,
    draftId,
    DraftStatus.REJECTED,
    { statusReason: reason ?? null },
    context,
  );
}

async function updateDraftStatus(
  productId: string,
  draftId: string,
  status: (typeof DraftStatus)[keyof typeof DraftStatus],
  options: { approvedById?: string | null; statusReason?: string | null },
  context?: PricingActionContext,
): Promise<PricingDraft> {
  await ensureProductExists(productId, context?.brandId);
  const draft = await findDraftByProduct(productId, draftId);
  if (!draft) {
    throw notFound("Draft not found");
  }

  // Block status transitions that would violate margin guardrails
  if (status === DraftStatus.PENDING_APPROVAL || status === DraftStatus.APPROVED) {
    const productCost = await getProductCost(draft.productId);
    assertNonNegativeMargin(decimalToNullableNumber(draft.newNet), productCost ?? undefined);
  }

  const updateData: DraftUpdateInput = { status };
  if (options.approvedById !== undefined) {
    updateData.approvedById = options.approvedById;
  }
  if (options.statusReason !== undefined) {
    updateData.statusReason = options.statusReason;
  }

  const updated = await updateDraftStatusRecord(draftId, updateData);

  const payload = {
    id: updated.id,
    productId: updated.productId,
    brandId: updated.brandId ?? undefined,
  };
  const eventContext = buildEventContext(context);
  if (status === DraftStatus.PENDING_APPROVAL) {
    await emitPricingDraftPendingApproval(payload, eventContext);
  } else if (status === DraftStatus.APPROVED) {
    await emitPricingDraftApproved(payload, eventContext);
  } else if (status === DraftStatus.REJECTED) {
    await emitPricingDraftRejected(payload, eventContext);
  }

  return mapDraft(updated);
}

async function applyDraftPricingSync(draft: PricingDraft) {
  if (draft.newNet == null) return;
  const productCost = await getProductCost(draft.productId);
  assertNonNegativeMargin(draft.newNet, productCost ?? undefined);
  await syncPricingFromDraft(draft.productId, draft.brandId ?? undefined, draft.newNet);
}

async function approveDraft(
  productId: string,
  draftId: string,
  approvedById?: string,
  context?: PricingActionContext,
) {
  const approverId = approvedById ?? context?.actorUserId ?? undefined;
  const updated = await updateDraftStatus(
    productId,
    draftId,
    DraftStatus.APPROVED,
    { approvedById: approverId },
    context,
  );
  await applyDraftPricingSync(updated);
  return updated;
}

async function addCompetitorPrice(
  productId: string,
  input: Record<string, unknown>,
  context?: PricingActionContext,
): Promise<CompetitorPricingDto> {
  const product = await ensureProductExists(productId, context?.brandId);
  const brandId = (input.brandId as string | undefined) ?? product.brandId ?? undefined;
  if (input.brandId && typeof input.brandId === "string") {
    await ensureBrandExists(input.brandId as string);
  }

  const competitorPrice = await createCompetitorPriceRecord({
    productId,
    brandId,
    competitor: String(input.competitor ?? ""),
    marketplace: typeof input.marketplace === "string" ? input.marketplace : undefined,
    country: typeof input.country === "string" ? input.country : undefined,
    priceNet: normalizeNumber(input.priceNet),
    priceGross: normalizeNumber(input.priceGross),
    currency: typeof input.currency === "string" ? input.currency : undefined,
    collectedAt:
      input.collectedAt instanceof Date ? input.collectedAt : input.collectedAt ? new Date(String(input.collectedAt)) : undefined,
  });

  const eventContext = buildEventContext({
    brandId: context?.brandId ?? competitorPrice.brandId ?? undefined,
    actorUserId: context?.actorUserId,
  });
  await emitCompetitorPriceRecorded({
    id: competitorPrice.id,
    productId: competitorPrice.productId,
    brandId: competitorPrice.brandId ?? undefined,
  }, eventContext);
  return mapCompetitorPrice(competitorPrice);
}

async function listCompetitorPrices(
  productId: string,
  params: { page?: number; pageSize?: number } = {},
  context?: PricingActionContext,
): Promise<{ data: CompetitorPricingDto[]; total: number; page: number; pageSize: number }> {
  await ensureProductExists(productId, context?.brandId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  const [total, competitors] = await listCompetitorPriceRecords(productId, { skip, take });
  return { data: competitors.map((record) => mapCompetitorPrice(record)), total, page, pageSize: take };
}

async function listLogs(
  productId: string,
  params: { page?: number; pageSize?: number } = {},
  context?: PricingActionContext,
): Promise<{ data: PricingLogDto[]; total: number; page: number; pageSize: number }> {
  await ensureProductExists(productId, context?.brandId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  const [total, logs] = await listPricingHistory(productId, { skip, take });
  return {
    data: logs.map((log) => ({
      id: log.id,
      productId: log.productId,
      brandId: log.brandId ?? undefined,
      channel: log.channel ?? undefined,
      oldNet: decimalToNullableNumber(log.oldNet),
      newNet: decimalToNullableNumber(log.newNet),
      aiAgent: log.aiAgent ?? undefined,
      confidenceScore: decimalToNullableNumber(log.confidenceScore),
      summary: log.summary ?? undefined,
      createdAt: log.createdAt,
    })),
    total,
    page,
    pageSize: take,
  };
}

async function createAISuggestion(
  input: AIPricingRequestDTO,
  context?: PricingActionContext,
): Promise<AIPricingSuggestion> {
  const product = await getProductWithPricing(input.productId);
  if (!product) {
    throw badRequest("Product not found");
  }
  if (context?.brandId && product.brandId && product.brandId !== context.brandId) {
    throw forbidden("Access denied for this brand");
  }

  const competitorSummary = input.competitors
    .map((item: any) => `${item.name}: ${item.price}`)
    .join("; ") || "No competitor data";
  const currentNet = decimalToNullableNumber(product.pricing?.b2cNet);
  const vatPct = decimalToNullableNumber(product.pricing?.vatPct);
  const costEur = minNonNull([
    decimalToNullableNumber(product.pricing?.cogsEur),
    decimalToNullableNumber(product.pricing?.fullCostEur),
  ]);
  const prompt = `${pricingSuggestionPrompt({
    productName: product.name,
    brandName: product.brand?.name,
    competitorSummary,
    currentNet,
    vatPct,
    marginHint: "Maintain margin >= 20%",
    strategyHint: input.strategy,
  })}\nMarket: ${input.market}`;
  const cacheKey = makeCacheKey(
    "pricing-ai",
    {
      productId: input.productId,
      market: input.market,
      competitors: input.competitors,
      strategy: input.strategy,
      brandId: context?.brandId,
      tenantId: context?.tenantId,
    },
    { brandId: context?.brandId, tenantId: context?.tenantId },
  );

  const fallback: RawPricingSuggestion = {
    suggestedPrice: decimalToNumber(product.pricing?.b2cNet),
    reasoning: "Used latest known net price as fallback.",
    riskLevel: "MEDIUM",
    competitorSummary,
    confidenceScore: 0.4,
    currentNet: decimalToNumber(product.pricing?.b2cNet),
    strategy: input.strategy ?? "standard",
    market: input.market,
    competitors: input.competitors,
  };

  const response = await orchestrateAI<RawPricingSuggestion>({
    key: cacheKey,
    messages: [{ role: "user", content: prompt }],
    fallback: () => fallback,
  });

  const suggestionPayload: RawPricingSuggestion = {
    ...response.result,
    market: input.market,
    competitors: input.competitors,
    strategy: input.strategy ?? response.result.strategy ?? "standard",
  };
  const wasClamped = costEur !== null && suggestionPayload.suggestedPrice !== null && suggestionPayload.suggestedPrice < costEur;
  const guardedPayload = clampToCostFloor(suggestionPayload, costEur);

  const insight = await logPricingInsight(
    product.id,
    product.brand?.id ?? undefined,
    guardedPayload,
  );
  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: "PRICING_SUGGESTION",
    agentName: AI_AGENT_NAME,
    metric: {
      productId: product.id,
      market: input.market,
      strategy: guardedPayload.strategy,
      cached: Boolean(response.cached),
      competitors: input.competitors?.length ?? 0,
      clamped: wasClamped,
    },
    brandId: product.brand?.id ?? null,
    tenantId: context?.tenantId ?? null,
    riskLevel: guardedPayload.riskLevel,
  });
  await recordHistory(
    product.id,
    product.brand?.id ?? undefined,
    "ai-suggest",
    currentNet,
      guardedPayload.suggestedPrice ?? null,
      guardedPayload.reasoning,
    context,
      { aiAgent: AI_AGENT_NAME, confidenceScore: guardedPayload.confidenceScore ?? null },
  );
  await emitPricingAISuggested(
    { id: insight.id, productId: product.id, brandId: product.brand?.id ?? undefined },
    buildEventContext(context),
  );
  return {
    id: insight.id,
    productId: product.id,
      suggestionJson: guardedPayload,
    createdAt: insight.createdAt,
  };
}

async function recordAIPlanResult(
  productId: string,
  brandId: string | undefined,
  summary: string,
  planPayload: unknown,
  context?: PricingActionContext,
) {
  await recordHistory(
    productId,
    brandId,
    "ai-plan",
    null,
    null,
    summary,
    context,
    { aiAgent: AI_PLAN_AGENT_NAME, confidenceScore: null },
  );
  await createLearningJournalEntry({
    productId,
    brandId: brandId ?? null,
    source: "pricing-plan",
    eventType: "pricing_plan",
    outputSnapshotJson: JSON.stringify(planPayload ?? {}),
  });
  await recordMonitoringEvent({
    category: "AGENT_ACTIVITY",
    status: "PRICING_PLAN",
    agentName: AI_PLAN_AGENT_NAME,
    metric: {
      productId,
      summaryLength: summary.length,
      hasPlanPayload: Boolean(planPayload),
    },
    brandId: brandId ?? null,
    tenantId: context?.tenantId ?? null,
    riskLevel: "LOW",
  });
  await emitPricingPlanGenerated(
    { id: productId, productId, brandId: brandId ?? undefined },
    buildEventContext(context),
  );
}

async function listAISuggestions(
  productId: string,
  params: { page?: number; pageSize?: number } = {},
  context?: PricingActionContext,
): Promise<{ data: AIPricingSuggestion[]; total: number; page: number; pageSize: number }> {
  await ensureProductExists(productId, context?.brandId);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(params.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  const [total, insights] = await listAIInsights(productId, { skip, take });
  return {
    data: insights.map((record) => ({
      id: record.id,
      productId: record.entityId ?? productId,
      suggestionJson: parseInsightDetails(record.details),
      createdAt: record.createdAt,
    })),
    total,
    page,
    pageSize: take,
  };
}

const pricingServiceCore = {
  listPricing,
  getPricingById,
  createPricing,
  updatePricing,
  deletePricing,
  createDraft,
  listDrafts,
  submitDraftForApproval,
  rejectDraft,
  addCompetitorPrice,
  listCompetitorPrices,
  listLogs,
  createAISuggestion,
  listAISuggestions,
  approveDraft,
};

export const pricingService = {
  ...pricingServiceCore,
  list: pricingServiceCore.listPricing,
  getById: pricingServiceCore.getPricingById,
  create: pricingServiceCore.createPricing,
  update: pricingServiceCore.updatePricing,
  remove: pricingServiceCore.deletePricing,
  recordAIPlanResult,
  generateAISuggestion(productId: string, input: PricingSuggestionInput = {}, context?: PricingActionContext) {
    const normalizedStrategy = (input.strategy ?? "standard") as AIPricingRequestDTO["strategy"];
    return pricingServiceCore.createAISuggestion(
      {
        productId,
        market: input.market ?? "global",
        competitors: input.competitors ?? [],
        strategy: normalizedStrategy,
      },
      context,
    );
  },
};

// Expose minimal test hooks for guardrail logic without coupling to prisma
export const __test__ = {
  assertNonNegativeMargin,
  minNonNull,
  clampToCostFloor,
};
