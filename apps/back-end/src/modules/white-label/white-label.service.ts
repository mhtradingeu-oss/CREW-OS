import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import {
  emitWhiteLabelOrderCreated,
  emitWhiteLabelOrderStatusChanged,
  emitWhiteLabelPricingSyncRequested,
} from "./white-label.events.js";
import type {
  CreateWLBrandInput,
  CreateWLOrderInput,
  CreateWLProductInput,
  PricingSyncRequestInput,
  UpdateWLBrandInput,
  UpdateWLOrderStatusInput,
  WLBrandListParams,
  WLBrandListResponse,
  WLBrandStatsDTO,
  WLProductListParams,
  WLProductListResponse,
  WhiteLabelBrandDTO,
  WhiteLabelBrandDetailDTO,
  WhiteLabelOrderDTO,
  WhiteLabelProductDTO,
} from "./white-label.types.js";
import {
  createWhiteLabelBrand,
  createWhiteLabelOrder,
  createWhiteLabelProduct,
  findAffiliateById,
  findBrandProductById,
  findPartnerById,
  findWhiteLabelBrandByIdAndBrand,
  findWhiteLabelBrandBySlug,
  findWhiteLabelBrandWithProductsAndOrders,
  findWhiteLabelOrderWithBrand,
  findWhiteLabelProductBySku,
  getWhiteLabelBrandStats,
  listWhiteLabelBrands,
  listWhiteLabelProducts,
  updateWhiteLabelBrand,
  updateWhiteLabelOrderStatus,
  WhiteLabelBrandPayload,
  WhiteLabelBrandStatsRecord,
  WhiteLabelOrderPayload,
  WhiteLabelProductPayload,
  WhiteLabelOrderWithBrandPayload,
  WhiteLabelBrandListFilters,
  WhiteLabelProductListFilters,
  PaginationArgs,
} from "../../core/db/repositories/white-label.repository.js";

function parseSettings(value: string | null) {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapBrand(record: WhiteLabelBrandPayload): WhiteLabelBrandDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    ownerPartnerId: record.ownerPartnerId ?? undefined,
    ownerAffiliateId: record.ownerAffiliateId ?? undefined,
    name: record.name,
    slug: record.slug,
    status: record.status ?? undefined,
    settings: parseSettings(record.settingsJson),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapProduct(record: WhiteLabelProductPayload): WhiteLabelProductDTO {
  return {
    id: record.id,
    wlBrandId: record.wlBrandId,
    baseProductId: record.baseProductId ?? undefined,
    name: record.name,
    sku: record.sku ?? undefined,
    pricing:
      record.pricingRecords?.[0] != null
        ? {
            id: record.pricingRecords[0].id,
            pricing: parseSettings(record.pricingRecords[0].pricingJson),
            createdAt: record.pricingRecords[0].createdAt,
            updatedAt: record.pricingRecords[0].updatedAt,
          }
        : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapOrder(record: WhiteLabelOrderPayload): WhiteLabelOrderDTO {
  return {
    id: record.id,
    wlBrandId: record.wlBrandId,
    status: record.status ?? undefined,
    total: record.total ? Number(record.total) : 0,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function buildStats(
  brandId: string,
  statsMap: Record<string, WhiteLabelBrandStatsRecord>,
): WLBrandStatsDTO {
  const stats = statsMap[brandId];
  return {
    brandId,
    productsCount: stats?.productCount ?? 0,
    ordersCount: stats?.orderCount ?? 0,
    totalRevenue: stats?.totalRevenue ?? 0,
  };
}

async function ensureWLBrandOwnership(wlBrandId: string, brandId: string) {
  const brand = await findWhiteLabelBrandByIdAndBrand(wlBrandId, brandId);
  if (!brand) {
    throw notFound("White-label brand not found");
  }
  return brand;
}

export const white_labelService = {
  async listWLBrands(params: WLBrandListParams): Promise<WLBrandListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const filters: WhiteLabelBrandListFilters = {
      brandId: params.brandId,
      ownerPartnerId: params.ownerPartnerId,
      ownerAffiliateId: params.ownerAffiliateId,
      status: params.status,
      search: params.search,
    };
    const pagination: PaginationArgs = { skip, take };

    const { total, rows, stats } = await listWhiteLabelBrands(filters, pagination);

    return {
      items: rows.map((row) => ({
        ...mapBrand(row),
        stats: buildStats(row.id, stats),
      })),
      total,
      page,
      pageSize: take,
    };
  },

  async getWLBrand(id: string, brandId: string): Promise<WhiteLabelBrandDetailDTO> {
    const record = await findWhiteLabelBrandWithProductsAndOrders(id, brandId);
    if (!record) throw notFound("White-label brand not found");

    return {
      ...mapBrand(record),
      products: (record.products ?? []).map(mapProduct),
      ordersCount: record.orders?.length ?? 0,
      orders: (record.orders ?? []).map(mapOrder),
    };
  },

  async createWLBrand(input: CreateWLBrandInput): Promise<WhiteLabelBrandDTO> {
    if (!input.name) {
      throw badRequest("Name is required");
    }

    if (input.slug) {
      const existing = await findWhiteLabelBrandBySlug(input.slug);
      if (existing) {
        throw badRequest("Slug already exists");
      }
    }

    if (input.ownerPartnerId) {
      const partner = await findPartnerById(input.ownerPartnerId);
      if (!partner) throw notFound("Partner owner not found");
    }
    if (input.ownerAffiliateId) {
      const affiliate = await findAffiliateById(input.ownerAffiliateId);
      if (!affiliate) throw notFound("Affiliate owner not found");
    }

    const created = await createWhiteLabelBrand({
      brandId: input.brandId,
      ownerPartnerId: input.ownerPartnerId ?? null,
      ownerAffiliateId: input.ownerAffiliateId ?? null,
      name: input.name,
      slug: input.slug ?? `${input.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
      status: input.status ?? "active",
      settingsJson: input.settings ? JSON.stringify(input.settings) : null,
    });

    logger.info(`[white-label] Created brand ${created.id}`);
    return mapBrand(created);
  },

  async updateWLBrand(id: string, brandId: string, input: UpdateWLBrandInput): Promise<WhiteLabelBrandDTO> {
    const existing = await findWhiteLabelBrandByIdAndBrand(id, brandId);
    if (!existing) throw notFound("White-label brand not found");

    if (input.slug && input.slug !== existing.slug) {
      const slugTaken = await findWhiteLabelBrandBySlug(input.slug);
      if (slugTaken && slugTaken.id !== id) {
        throw badRequest("Slug already in use");
      }
    }

    const updated = await updateWhiteLabelBrand(id, {
      name: input.name ?? existing.name,
      slug: input.slug ?? existing.slug,
      status: input.status ?? existing.status,
      settingsJson:
        input.settings !== undefined
          ? input.settings
            ? JSON.stringify(input.settings)
            : null
          : existing.settingsJson,
    });

    logger.info(`[white-label] Updated brand ${id}`);
    return mapBrand(updated);
  },

  async listWLProducts(params: WLProductListParams): Promise<WLProductListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    await ensureWLBrandOwnership(params.wlBrandId, params.brandId);

    const { page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const filters: WhiteLabelProductListFilters = {
      wlBrandId: params.wlBrandId,
      search: params.search,
    };
    const pagination: PaginationArgs = { skip, take };

    const [total, rows] = await listWhiteLabelProducts(filters, pagination);

    return {
      items: rows.map(mapProduct),
      total,
      page,
      pageSize: take,
    };
  },

  async createWLProduct(input: CreateWLProductInput): Promise<WhiteLabelProductDTO> {
    await ensureWLBrandOwnership(input.wlBrandId, input.brandId);

    if (input.baseProductId) {
      const baseProduct = await findBrandProductById(input.baseProductId);
      if (!baseProduct) throw notFound("Base product not found");
    }

    if (input.sku) {
      const skuExists = await findWhiteLabelProductBySku(input.sku);
      if (skuExists) throw badRequest("SKU already exists");
    }

    const created = await createWhiteLabelProduct({
      wlBrandId: input.wlBrandId,
      baseProductId: input.baseProductId ?? null,
      name: input.name,
      sku: input.sku ?? null,
    });

    logger.info(`[white-label] Created product ${created.id} for brand ${input.wlBrandId}`);
    return mapProduct(created);
  },

  async getWLBrandStats(id: string, brandId: string): Promise<WLBrandStatsDTO> {
    await ensureWLBrandOwnership(id, brandId);

    const stats = await getWhiteLabelBrandStats(id);
    return {
      brandId: id,
      productsCount: stats.productCount,
      ordersCount: stats.ordersCount,
      totalRevenue: stats.totalRevenue,
    };
  },

  async createWLOrder(input: CreateWLOrderInput): Promise<WhiteLabelOrderDTO> {
    await ensureWLBrandOwnership(input.wlBrandId, input.brandId);
    const created = await createWhiteLabelOrder({
      wlBrandId: input.wlBrandId,
      total: input.total,
      status: input.status ?? "draft",
    });

    await emitWhiteLabelOrderCreated(
      {
        brandId: input.brandId,
        wlBrandId: input.wlBrandId,
        orderId: created.id,
        totalAmount: Number(created.total ?? 0),
        currency: input.currency,
        newStatus: created.status ?? "draft",
      },
      { brandId: input.brandId, module: "white-label", source: "api" },
    );

    return mapOrder(created);
  },
  updateWLOrderStatus,
  requestPricingSync,
};

async function updateWLOrderStatus(
  orderId: string,
  input: UpdateWLOrderStatusInput,
): Promise<WhiteLabelOrderDTO> {
  const order = await ensureOrderForBrand(orderId, input.brandId);
  const updated = await updateWhiteLabelOrderStatus(orderId, input.newStatus);

  await emitWhiteLabelOrderStatusChanged(
    {
      brandId: input.brandId,
      wlBrandId: input.wlBrandId,
      orderId: updated.id,
      totalAmount: Number(updated.total ?? 0),
      currency: undefined,
      oldStatus: order.status ?? undefined,
      newStatus: updated.status ?? undefined,
    },
    { brandId: input.brandId, module: "white-label", source: "api" },
  );

  return mapOrder(updated);
}

async function requestPricingSync(input: PricingSyncRequestInput) {
  await ensureWLBrandOwnership(input.wlBrandId, input.brandId);
  await emitWhiteLabelPricingSyncRequested(
    {
      brandId: input.brandId,
      wlBrandId: input.wlBrandId,
      productId: input.productId,
      currentPrice: input.currentPrice,
      targetChannels: input.targetChannels,
    },
    { brandId: input.brandId, module: "white-label", source: "api" },
  );
  return { status: "queued" };
}

async function ensureOrderForBrand(orderId: string, brandId: string) {
  const order: WhiteLabelOrderWithBrandPayload | null = await findWhiteLabelOrderWithBrand(orderId);
  if (!order) throw notFound("Order not found");
  if (order.wlBrand.brandId !== brandId) {
    throw badRequest("Order does not belong to the requested brand");
  }
  return order;
}
