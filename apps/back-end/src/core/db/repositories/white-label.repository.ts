import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const brandSelect = {
  id: true,
  brandId: true,
  ownerPartnerId: true,
  ownerAffiliateId: true,
  name: true,
  slug: true,
  status: true,
  settingsJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WhiteLabelBrandSelect;

const productSelect = {
  id: true,
  wlBrandId: true,
  baseProductId: true,
  name: true,
  sku: true,
  pricingRecords: {
    take: 1,
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      pricingJson: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WhiteLabelProductSelect;

const orderSelect = {
  id: true,
  wlBrandId: true,
  status: true,
  total: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.WhiteLabelOrderSelect;

const brandWithRelationsSelect = {
  ...brandSelect,
  products: {
    select: productSelect,
    orderBy: { createdAt: "desc" },
  },
  orders: {
    select: orderSelect,
  },
} satisfies Prisma.WhiteLabelBrandSelect & {
  products: {
    select: typeof productSelect;
    orderBy: { createdAt: "desc" };
  };
  orders: { select: typeof orderSelect };
};

const orderWithBrandSelect = {
  id: true,
  wlBrandId: true,
  status: true,
  total: true,
  wlBrand: {
    select: {
      id: true,
      brandId: true,
    },
  },
} satisfies Prisma.WhiteLabelOrderSelect & {
  wlBrand: { select: { id: true; brandId: true } };
};

const partnerSelect = {
  id: true,
} satisfies Prisma.PartnerSelect;

const affiliateSelect = {
  id: true,
} satisfies Prisma.AffiliateSelect;

const brandProductSelect = {
  id: true,
} satisfies Prisma.BrandProductSelect;

export type WhiteLabelBrandPayload = Prisma.WhiteLabelBrandGetPayload<{ select: typeof brandSelect }>;
export type WhiteLabelBrandDetailsPayload = Prisma.WhiteLabelBrandGetPayload<{
  select: typeof brandWithRelationsSelect;
}>;
export type WhiteLabelProductPayload = Prisma.WhiteLabelProductGetPayload<{ select: typeof productSelect }>;
export type WhiteLabelOrderPayload = Prisma.WhiteLabelOrderGetPayload<{ select: typeof orderSelect }>;
export type WhiteLabelOrderWithBrandPayload = Prisma.WhiteLabelOrderGetPayload<{
  select: typeof orderWithBrandSelect;
}>;
export type PartnerIdPayload = Prisma.PartnerGetPayload<{ select: typeof partnerSelect }>;
export type AffiliateIdPayload = Prisma.AffiliateGetPayload<{ select: typeof affiliateSelect }>;
export type BrandProductPayload = Prisma.BrandProductGetPayload<{ select: typeof brandProductSelect }>;

export type WhiteLabelBrandStatsRecord = {
  productCount: number;
  orderCount: number;
  totalRevenue: number;
};

export type WhiteLabelBrandListFilters = {
  brandId: string;
  ownerPartnerId?: string;
  ownerAffiliateId?: string;
  status?: string;
  search?: string;
};

export type WhiteLabelProductListFilters = {
  wlBrandId: string;
  search?: string;
};

export type PaginationArgs = {
  skip: number;
  take: number;
};

export async function listWhiteLabelBrands(
  filters: WhiteLabelBrandListFilters,
  pagination: PaginationArgs,
): Promise<{
  total: number;
  rows: WhiteLabelBrandPayload[];
  stats: Record<string, WhiteLabelBrandStatsRecord>;
}> {
  const where: Prisma.WhiteLabelBrandWhereInput = {
    brandId: filters.brandId,
  };
  if (filters.ownerPartnerId) where.ownerPartnerId = filters.ownerPartnerId;
  if (filters.ownerAffiliateId) where.ownerAffiliateId = filters.ownerAffiliateId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { slug: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.whiteLabelBrand.count({ where }),
    prisma.whiteLabelBrand.findMany({
      where,
      select: brandSelect,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  const stats: Record<string, WhiteLabelBrandStatsRecord> = {};
  const brandIds = rows.map((row) => row.id);
  for (const id of brandIds) {
    stats[id] = { productCount: 0, orderCount: 0, totalRevenue: 0 };
  }

  if (brandIds.length) {
    const [productCounts, orderMetrics] = await prisma.$transaction([
      prisma.whiteLabelProduct.groupBy({
        by: ["wlBrandId"],
        where: { wlBrandId: { in: brandIds } },
        orderBy: { wlBrandId: "asc" },
        _count: { _all: true },
      }),
      prisma.whiteLabelOrder.groupBy({
        by: ["wlBrandId"],
        where: { wlBrandId: { in: brandIds } },
        orderBy: { wlBrandId: "asc" },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

    for (const item of productCounts) {
      const count =
        typeof item._count === "object" && item._count?._all != null
          ? item._count._all
          : 0;
      const entry =
        stats[item.wlBrandId] ??
        (stats[item.wlBrandId] = {
          productCount: 0,
          orderCount: 0,
          totalRevenue: 0,
        });
      entry.productCount = count;
    }

    for (const entry of orderMetrics) {
      const count =
        typeof entry._count === "object" && entry._count?._all != null
          ? entry._count._all
          : 0;
      const sumTotal =
        typeof entry._sum === "object" && entry._sum?.total != null
          ? Number(entry._sum.total)
          : 0;
      const record =
        stats[entry.wlBrandId] ??
        (stats[entry.wlBrandId] = {
          productCount: 0,
          orderCount: 0,
          totalRevenue: 0,
        });
      record.orderCount = count;
      record.totalRevenue = sumTotal;
    }
  }

  return { total, rows, stats };
}

export async function findWhiteLabelBrandByIdAndBrand(
  id: string,
  brandId: string,
): Promise<WhiteLabelBrandPayload | null> {
  return prisma.whiteLabelBrand.findFirst({
    where: { id, brandId },
    select: brandSelect,
  });
}

export async function findWhiteLabelBrandWithProductsAndOrders(
  id: string,
  brandId: string,
): Promise<WhiteLabelBrandDetailsPayload | null> {
  return prisma.whiteLabelBrand.findFirst({
    where: { id, brandId },
    select: brandWithRelationsSelect,
  });
}

export async function findWhiteLabelBrandBySlug(slug: string): Promise<WhiteLabelBrandPayload | null> {
  return prisma.whiteLabelBrand.findUnique({
    where: { slug },
    select: brandSelect,
  });
}

export async function createWhiteLabelBrand(
  data: Prisma.WhiteLabelBrandUncheckedCreateInput,
): Promise<WhiteLabelBrandPayload> {
  return prisma.whiteLabelBrand.create({
    data,
    select: brandSelect,
  });
}

export async function updateWhiteLabelBrand(
  id: string,
  data: Prisma.WhiteLabelBrandUncheckedUpdateInput,
): Promise<WhiteLabelBrandPayload> {
  return prisma.whiteLabelBrand.update({
    where: { id },
    data,
    select: brandSelect,
  });
}

export async function listWhiteLabelProducts(
  filters: WhiteLabelProductListFilters,
  pagination: PaginationArgs,
): Promise<[number, WhiteLabelProductPayload[]]> {
  const where: Prisma.WhiteLabelProductWhereInput = {
    wlBrandId: filters.wlBrandId,
  };
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { sku: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.$transaction([
    prisma.whiteLabelProduct.count({ where }),
    prisma.whiteLabelProduct.findMany({
      where,
      select: productSelect,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function findWhiteLabelProductBySku(
  sku: string,
): Promise<WhiteLabelProductPayload | null> {
  return prisma.whiteLabelProduct.findFirst({
    where: { sku },
    select: productSelect,
  });
}

export async function createWhiteLabelProduct(
  data: Prisma.WhiteLabelProductUncheckedCreateInput,
): Promise<WhiteLabelProductPayload> {
  return prisma.whiteLabelProduct.create({
    data,
    select: productSelect,
  });
}

export async function findBrandProductById(id: string): Promise<BrandProductPayload | null> {
  return prisma.brandProduct.findUnique({
    where: { id },
    select: brandProductSelect,
  });
}

export async function getWhiteLabelBrandStats(wlBrandId: string): Promise<{
  productCount: number;
  ordersCount: number;
  totalRevenue: number;
}> {
  const [productCount, orderMetrics] = await prisma.$transaction([
    prisma.whiteLabelProduct.count({ where: { wlBrandId } }),
    prisma.whiteLabelOrder.aggregate({
      where: { wlBrandId },
      _count: true,
      _sum: { total: true },
    }),
  ]);

  return {
    productCount,
    ordersCount: orderMetrics._count,
    totalRevenue: Number(orderMetrics._sum.total ?? 0),
  };
}

export async function createWhiteLabelOrder(
  data: Prisma.WhiteLabelOrderUncheckedCreateInput,
): Promise<WhiteLabelOrderPayload> {
  return prisma.whiteLabelOrder.create({
    data,
    select: orderSelect,
  });
}

export async function findWhiteLabelOrderWithBrand(
  orderId: string,
): Promise<WhiteLabelOrderWithBrandPayload | null> {
  return prisma.whiteLabelOrder.findUnique({
    where: { id: orderId },
    select: orderWithBrandSelect,
  });
}

export async function updateWhiteLabelOrderStatus(
  orderId: string,
  status: string,
): Promise<WhiteLabelOrderPayload> {
  return prisma.whiteLabelOrder.update({
    where: { id: orderId },
    data: { status },
    select: orderSelect,
  });
}

export async function findPartnerById(id: string): Promise<PartnerIdPayload | null> {
  return prisma.partner.findUnique({
    where: { id },
    select: partnerSelect,
  });
}

export async function findAffiliateById(id: string): Promise<AffiliateIdPayload | null> {
  return prisma.affiliate.findUnique({
    where: { id },
    select: affiliateSelect,
  });
}
