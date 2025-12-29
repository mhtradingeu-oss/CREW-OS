import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const pricingSelect = {
  id: true,
  productId: true,
  brandId: true,
  cogsEur: true,
  fullCostEur: true,
  b2cNet: true,
  b2cGross: true,
  vatPct: true,
  createdAt: true,
  updatedAt: true,
  brand: { select: { defaultCurrency: true } },
} satisfies Prisma.ProductPricingSelect;

const draftSelect = {
  id: true,
  productId: true,
  brandId: true,
  channel: true,
  oldNet: true,
  newNet: true,
  status: true,
  statusReason: true,
  createdById: true,
  approvedById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductPriceDraftSelect;

const competitorSelect = {
  id: true,
  productId: true,
  brandId: true,
  competitor: true,
  marketplace: true,
  country: true,
  priceNet: true,
  priceGross: true,
  currency: true,
  collectedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompetitorPriceSelect;

const logSelect = {
  id: true,
  productId: true,
  brandId: true,
  channel: true,
  oldNet: true,
  newNet: true,
  aiAgent: true,
  confidenceScore: true,
  summary: true,
  createdAt: true,
} satisfies Prisma.AIPricingHistorySelect;

const insightSelect = {
  id: true,
  entityId: true,
  details: true,
  createdAt: true,
} satisfies Prisma.AIInsightSelect;

const productMinimalSelect = {
  id: true,
  brandId: true,
  name: true,
} satisfies Prisma.BrandProductSelect;

const productWithPricingSelect = {
  id: true,
  name: true,
  brandId: true,
  brand: { select: { id: true, name: true } },
  pricing: {
    select: {
      b2cNet: true,
      vatPct: true,
      cogsEur: true,
      fullCostEur: true,
    },
  },
} satisfies Prisma.BrandProductSelect;

export const PRICING_INSIGHT_ENTITY = "pricing-suggestion";
const insightPricingWhere = { entityType: PRICING_INSIGHT_ENTITY, os: "pricing" };

function decimalToNullableNumber(value?: Prisma.Decimal | null) {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export type PricingPayload = Prisma.ProductPricingGetPayload<{ select: typeof pricingSelect }>;
export type PricingDraftPayload = Prisma.ProductPriceDraftGetPayload<{ select: typeof draftSelect }>;
export type CompetitorPricePayload = Prisma.CompetitorPriceGetPayload<{ select: typeof competitorSelect }>;
export type PricingHistoryPayload = Prisma.AIPricingHistoryGetPayload<{ select: typeof logSelect }>;
export type AIInsightPayload = Prisma.AIInsightGetPayload<{ select: typeof insightSelect }>;
export type ProductWithPricingPayload = Prisma.BrandProductGetPayload<{ select: typeof productWithPricingSelect }>;
export type ProductMinimalPayload = Prisma.BrandProductGetPayload<{ select: typeof productMinimalSelect }>;
export type BrandPayload = Prisma.BrandGetPayload<{ select: { id: true; defaultCurrency: true } }>;

export type PricingCreateInput = Prisma.ProductPricingUncheckedCreateInput;
export type PricingUpdateInput = Prisma.ProductPricingUncheckedUpdateInput;
export type DraftCreateInput = Prisma.ProductPriceDraftUncheckedCreateInput;
export type DraftUpdateInput = Prisma.ProductPriceDraftUncheckedUpdateInput;
export type CompetitorPriceCreateInput = Prisma.CompetitorPriceUncheckedCreateInput;
export type PricingHistoryCreateInput = Prisma.AIPricingHistoryUncheckedCreateInput;
export type AIInsightCreateInput = Prisma.AIInsightUncheckedCreateInput;
export type LearningJournalCreateInput = Prisma.AILearningJournalUncheckedCreateInput;

// Pricing CRUD
export async function listPricingRecords(
  filters: { productId?: string; brandId?: string },
  pagination: { skip: number; take: number },
): Promise<[number, PricingPayload[]]> {
  const where: Prisma.ProductPricingWhereInput = {};
  if (filters.productId) {
    where.productId = filters.productId;
  }
  if (filters.brandId) {
    where.brandId = filters.brandId;
  }
  return prisma.$transaction([
    prisma.productPricing.count({ where }),
    prisma.productPricing.findMany({
      where,
      select: pricingSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function findPricingById(id: string): Promise<PricingPayload | null> {
  return prisma.productPricing.findUnique({ where: { id }, select: pricingSelect });
}

export async function findPricingByProductId(productId: string): Promise<PricingPayload | null> {
  return prisma.productPricing.findUnique({ where: { productId }, select: pricingSelect });
}

export async function createPricingRecord(data: PricingCreateInput): Promise<PricingPayload> {
  return prisma.productPricing.create({ data, select: pricingSelect });
}

export async function updatePricingRecord(id: string, data: PricingUpdateInput): Promise<PricingPayload> {
  return prisma.productPricing.update({ where: { id }, data, select: pricingSelect });
}

export async function deletePricingRecord(id: string): Promise<void> {
  await prisma.productPricing.delete({ where: { id } });
}

export async function syncPricingFromDraft(
  productId: string,
  brandId: string | undefined,
  b2cNet: number,
): Promise<void> {
  const existing = await prisma.productPricing.findUnique({
    where: { productId },
    select: { id: true },
  });
  if (existing) {
    await prisma.productPricing.update({
      where: { id: existing.id },
      data: { b2cNet },
    });
    return;
  }
  await prisma.productPricing.create({
    data: {
      productId,
      brandId: brandId ?? undefined,
      b2cNet,
    },
  });
}

// Draft management
export async function createDraftEntry(
  data: DraftCreateInput,
): Promise<PricingDraftPayload> {
  return prisma.productPriceDraft.create({
    data,
    select: draftSelect,
  });
}

export async function listDraftsByProduct(
  productId: string,
  pagination: { skip: number; take: number },
): Promise<[number, PricingDraftPayload[]]> {
  return prisma.$transaction([
    prisma.productPriceDraft.count({ where: { productId } }),
    prisma.productPriceDraft.findMany({
      where: { productId },
      select: draftSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function findDraftByProduct(productId: string, draftId: string): Promise<PricingDraftPayload | null> {
  return prisma.productPriceDraft.findFirst({
    where: { productId, id: draftId },
    select: draftSelect,
  });
}

export async function updateDraftStatus(
  draftId: string,
  data: DraftUpdateInput,
): Promise<PricingDraftPayload> {
  return prisma.productPriceDraft.update({
    where: { id: draftId },
    data,
    select: draftSelect,
  });
}

// Competitor prices
export async function createCompetitorPriceRecord(
  data: CompetitorPriceCreateInput,
): Promise<CompetitorPricePayload> {
  return prisma.competitorPrice.create({
    data,
    select: competitorSelect,
  });
}

export async function listCompetitorPrices(
  productId: string,
  pagination: { skip: number; take: number },
): Promise<[number, CompetitorPricePayload[]]> {
  return prisma.$transaction([
    prisma.competitorPrice.count({ where: { productId } }),
    prisma.competitorPrice.findMany({
      where: { productId },
      select: competitorSelect,
      orderBy: { collectedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

// Logs / History / Insights / LearningJournal
export async function createPricingHistoryEntry(
  data: PricingHistoryCreateInput,
): Promise<PricingHistoryPayload> {
  return prisma.aIPricingHistory.create({
    data,
    select: logSelect,
  });
}

export async function listPricingHistory(
  productId: string,
  pagination: { skip: number; take: number },
): Promise<[number, PricingHistoryPayload[]]> {
  return prisma.$transaction([
    prisma.aIPricingHistory.count({ where: { productId } }),
    prisma.aIPricingHistory.findMany({
      where: { productId },
      select: logSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function createAIInsightEntry(
  data: AIInsightCreateInput,
): Promise<AIInsightPayload> {
  return prisma.aIInsight.create({
    data,
    select: insightSelect,
  });
}

export async function listAIInsights(
  productId: string,
  pagination: { skip: number; take: number },
): Promise<[number, AIInsightPayload[]]> {
  return prisma.$transaction([
    prisma.aIInsight.count({
      where: { ...insightPricingWhere, entityId: productId },
    }),
    prisma.aIInsight.findMany({
      where: { ...insightPricingWhere, entityId: productId },
      select: insightSelect,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function createLearningJournalEntry(data: LearningJournalCreateInput): Promise<void> {
  await prisma.aILearningJournal.create({ data });
}

// Auxiliary lookups
export async function getProductCost(productId: string): Promise<number | null> {
  const pricing = await prisma.productPricing.findUnique({
    where: { productId },
    select: { cogsEur: true },
  });
  return decimalToNullableNumber(pricing?.cogsEur);
}

export async function findProductWithBrand(productId: string): Promise<ProductMinimalPayload | null> {
  return prisma.brandProduct.findUnique({
    where: { id: productId },
    select: productMinimalSelect,
  });
}

export async function findBrandById(brandId: string): Promise<BrandPayload | null> {
  return prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, defaultCurrency: true },
  });
}

export async function ensureBrandHasCurrency(brandId: string, currency: string): Promise<void> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, defaultCurrency: true },
  });
  if (brand && !brand.defaultCurrency) {
    await prisma.brand.update({
      where: { id: brandId },
      data: { defaultCurrency: currency },
    });
  }
}

export async function getProductWithPricing(productId: string): Promise<ProductWithPricingPayload | null> {
  return prisma.brandProduct.findUnique({
    where: { id: productId },
    select: productWithPricingSelect,
  });
}
