import type {
  CompetitorPriceRecord,
  GetCompetitorPricesInput,
  ScanCompetitorsInput,
  ScanResult,
} from "./competitor.dto.js";
import { buildPagination } from "../../core/utils/pagination.js";

/**
 * Minimal competitor service skeleton.
 * TODO: replace stub implementations with real intelligence integrations.
 */

import { createCompetitorPriceRecord, listCompetitorPrices, findProductWithBrand } from "../../core/db/repositories/pricing.repository.js";
import { emitCompetitorPriceUpdated } from "./competitor.events.js";

export const competitorService = {
  async scanCompetitors(_: ScanCompetitorsInput): Promise<ScanResult> {
    return {
      items: [],
      message: "TODO: implement competitor scanning",
      total: 0,
      page: 1,
      pageSize: 0,
    };
  },

  async getCompetitorPrices(
    params: GetCompetitorPricesInput,
  ): Promise<{ items: CompetitorPriceRecord[]; total: number; page: number; pageSize: number }> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    let total = 0;
    let items: CompetitorPriceRecord[] = [];
    if (params.productId) {
      [total, items] = await listCompetitorPrices(params.productId, { skip, take });
    }
    return { items, total, page, pageSize };
  },

  async addCompetitorPrice(input: {
    competitorId: string;
    productId: string;
    price: number;
    currency: string;
    brandId?: string;
  }): Promise<CompetitorPriceRecord> {
    // Link to product and persist price
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
    // Emit event
    await emitCompetitorPriceUpdated({
      competitorId: input.competitorId,
      productId: input.productId,
      price: input.price,
      currency: input.currency,
      updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      brandId: (input.brandId ?? product.brandId) ?? undefined,
    });
    return {
      competitorId: record.competitor,
      productId: record.productId,
      name: record.competitor,
      price: record.priceNet,
      currency: record.currency,
      updatedAt: record.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  },
};
