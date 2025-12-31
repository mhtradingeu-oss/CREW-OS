import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { BrandRepository } from "../../core/db/repositories/brand.repository.js";
import {
  CompetitorPriceCreateInput,
  CompetitorPricePayload,
  createCompetitorPriceRecord,
  findCompetitorPriceRecords,
  findProductWithBrand,
  upsertCompetitorPriceRecord,
} from "../../core/db/repositories/pricing.repository.js";
import { emitCompetitorPriceUpdated } from "./competitor.events.js";
import type {
  CompetitorPriceRecord,
  GetCompetitorPricesInput,
  ScanCompetitorsInput,
  ScanResult,
} from "./competitor.dto.js";

const SCAN_PRODUCT_LIMIT = 3;
const SCAN_COMPETITOR_COUNT = 3;
const DEFAULT_MARKET = "global";
const DEFAULT_CURRENCY = "USD";
const MARKET_COMPETITORS: Record<string, string[]> = {
  [DEFAULT_MARKET]: ["Northwind Labs", "Summit Collective", "Aurora Field"],
  "north-america": ["Praxis Supply", "Harbor & Co.", "Redwood Commerce"],
  europe: ["Atlas Merchant", "Nordic Thread", "Stella Markets"],
  apac: ["Lotus Lane", "Bamboo Bloom", "Pacifica Goods"],
};

function normalizeMarket(input?: string): string {
  if (!input) return DEFAULT_MARKET;
  const normalized = input.trim().toLowerCase();
  return normalized || DEFAULT_MARKET;
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ");
}

function sanitizeKeywords(keywords?: string[]): string[] {
  if (!Array.isArray(keywords)) return [];
  const seen = new Set<string>();
  return keywords
    .map((word) => word.trim())
    .filter((word) => Boolean(word))
    .map((word) => word.replace(/\s+/g, " "))
    .filter((word) => {
      const lower = word.toLowerCase();
      if (seen.has(lower)) return false;
      seen.add(lower);
      return true;
    })
    .map((word) => word.split(" ").map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()).join(" "));
}

function buildCompetitorNames(market: string, keywords: string[]): string[] {
  const pool = MARKET_COMPETITORS[market] ?? MARKET_COMPETITORS[DEFAULT_MARKET];
  const extras = Array.isArray(keywords) ? keywords.map((keyword) => `${keyword} Exchange`) : [];
  const candidates = ([] as string[])
    .concat(Array.isArray(pool) ? pool : [])
    .concat(Array.isArray(extras) ? extras : []);
  return candidates.slice(0, SCAN_COMPETITOR_COUNT);
}

function ensureBasePrice(value: number | null): number {
  if (value != null && Number.isFinite(value) && value > 0) {
    return value;
  }
  return 20;
}

function computePrice(base: number | null, index: number): number {
  const swing = 0.04 * (index + 1);
  const price = ensureBasePrice(base) * (1 + swing);
  return Number(price.toFixed(2));
}

function decimalToNumber(value?: Prisma.Decimal | null): number | null {
  if (value == null) return null;
  return Number(value);
}

function mapCompetitorRecord(record: CompetitorPricePayload): CompetitorPriceRecord {
  const rawPrice = record.priceNet ?? record.priceGross ?? 0;
  return {
    competitorId: record.competitor,
    productId: record.productId,
    name: record.competitor,
    price: Number(rawPrice),
    currency: record.currency ?? DEFAULT_CURRENCY,
    source: record.marketplace ?? undefined,
    updatedAt: record.updatedAt?.toISOString(),
  };
}

export const competitorService = {
  async scanCompetitors(input: ScanCompetitorsInput): Promise<ScanResult> {
    const brandId = typeof input.brandId === "string" ? input.brandId.trim() : undefined;
    if (!brandId) {
      throw badRequest("brandId is required for competitor scans");
    }

    const brand = await BrandRepository.findBrandById({
      where: { id: brandId },
      select: { id: true, name: true, defaultCurrency: true },
    });
    if (!brand) {
      throw notFound("Brand not found");
    }

    const normalizedMarket = normalizeMarket(input.market);
    const keywords = sanitizeKeywords(input.keywords);
    const competitorNames = buildCompetitorNames(normalizedMarket, keywords);

    const products = await prisma.brandProduct.findMany({
      where: { brandId },
      select: {
        id: true,
        name: true,
        pricing: {
          select: {
            b2cNet: true,
            b2cGross: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: SCAN_PRODUCT_LIMIT,
    });

    if (!products.length) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 0,
        message: `No products found for ${brand.name}`,
      };
    }

    const currency = brand.defaultCurrency ?? DEFAULT_CURRENCY;
    const inserted: CompetitorPriceRecord[] = [];

    for (const product of products) {
      const base =
        decimalToNumber(product.pricing?.b2cNet) ??
        decimalToNumber(product.pricing?.b2cGross) ??
        null;
      for (const [index, competitorName] of competitorNames.entries()) {
        const price = computePrice(base ?? null, index);
        const payload: CompetitorPriceCreateInput = {
          productId: product.id,
          brandId,
          competitor: competitorName,
          marketplace: normalizedMarket,
          country: normalizedMarket,
          priceNet: price,
          priceGross: price,
          currency,
          collectedAt: new Date(),
        };
        const record = await upsertCompetitorPriceRecord(
          {
            productId: product.id,
            competitor: competitorName,
            marketplace: normalizedMarket,
            country: normalizedMarket,
          },
          payload,
        );
        inserted.push(mapCompetitorRecord(record));
        await emitCompetitorPriceUpdated({
          competitorId: competitorName,
          productId: product.id,
          price,
          currency,
          updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString(),
          brandId,
        });
      }
    }

    if (!inserted.length) {
      return {
        items: [],
        total: 0,
        page: 1,
        pageSize: 0,
        message: `No competitor data captured for ${brand.name}`,
      };
    }

    const [total, storedRecords] = await findCompetitorPriceRecords(
      { brandId, marketplace: normalizedMarket },
      { skip: 0, take: Math.max(inserted.length, SCAN_COMPETITOR_COUNT) },
    );

    const pageSize = storedRecords.length;
    const marketLabel = toTitleCase(normalizedMarket);
    const message = `${input.includeAutoUpdates ? "Auto" : "Manual"} scan recorded ${storedRecords.length} competitor prices for ${marketLabel}`;

    return {
      items: storedRecords.map(mapCompetitorRecord),
      total,
      page: 1,
      pageSize,
      message,
    };
  },

  async getCompetitorPrices(
    params: GetCompetitorPricesInput,
  ): Promise<{ items: CompetitorPriceRecord[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });

    const filters: Prisma.CompetitorPriceWhereInput = {};
    if (params.brandId) filters.brandId = params.brandId;
    if (params.productId) filters.productId = params.productId;
    if (params.competitorId) filters.competitor = params.competitorId;
    if (typeof params.market === "string" && params.market.trim()) {
      filters.marketplace = normalizeMarket(params.market);
    }
    if (params.country) filters.country = params.country;

    const hasFilter =
      Boolean(filters.brandId) ||
      Boolean(filters.productId) ||
      Boolean(filters.competitor) ||
      Boolean(filters.marketplace) ||
      Boolean(filters.country);

    if (!hasFilter) {
      return { items: [], total: 0, page, pageSize: take };
    }

    const [total, records] = await findCompetitorPriceRecords(filters, { skip, take });
    return {
      items: records.map(mapCompetitorRecord),
      total,
      page,
      pageSize,
    };
  },

  async addCompetitorPrice(input: {
    competitorId: string;
    productId: string;
    price: number;
    currency: string;
    brandId?: string;
  }): Promise<CompetitorPriceRecord> {
    const product = await findProductWithBrand(input.productId);
    if (!product) throw new Error("Product not found");
    const record = await createCompetitorPriceRecord({
      competitor: input.competitorId,
      productId: input.productId,
      brandId: (input.brandId ?? product.brandId) ?? undefined,
      priceNet: input.price,
      currency: input.currency,
      collectedAt: new Date().toISOString(),
    });
    await emitCompetitorPriceUpdated({
      competitorId: record.competitor,
      productId: record.productId,
      price: record.priceNet == null ? 0 : (typeof record.priceNet === 'object' && typeof record.priceNet.toNumber === 'function' ? record.priceNet.toNumber() : Number(record.priceNet)),
      currency: record.currency ?? input.currency,
      updatedAt: record.updatedAt?.toISOString() ?? new Date().toISOString(),
      brandId: (input.brandId ?? product.brandId) ?? undefined,
    });
    return {
      competitorId: record.competitor,
      productId: record.productId,
      name: record.competitor,
      price: Number(record.priceNet ?? 0),
      currency: record.currency ?? input.currency,
      updatedAt: record.updatedAt?.toISOString(),
    };
  },
};
