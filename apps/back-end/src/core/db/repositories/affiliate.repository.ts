

import { prisma, type PrismaData, type PrismaSelect, type PrismaWhere } from "../../prisma.js";

// --- Selects ---
const affiliateSelect: PrismaSelect<typeof prisma.affiliate.findMany> = {
  id: true,
  brandId: true,
  tierId: true,
  code: true,
  type: true,
  channel: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  tier: {
    select: {
      id: true,
      brandId: true,
      name: true,
      rulesJson: true,
    },
  },
};

const linkSelect: PrismaSelect<typeof prisma.affiliateLink.findMany> = {
  id: true,
  affiliateId: true,
  linkCode: true,
  targetUrl: true,
  createdAt: true,
  updatedAt: true,
};

const conversionSelect: PrismaSelect<typeof prisma.affiliateConversion.findMany> = {
  id: true,
  brandId: true,
  affiliateId: true,
  orderId: true,
  amount: true,
  currency: true,
  metadata: true,
  createdAt: true,
  updatedAt: true,
};

const payoutSelect: PrismaSelect<typeof prisma.affiliatePayout.findMany> = {
  id: true,
  affiliateId: true,
  brandId: true,
  amount: true,
  currency: true,
  status: true,
  method: true,
  notes: true,
  requestedAt: true,
  resolvedAt: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
};

// --- Repository ---
export const affiliateRepository = {
    async findConversionByAffiliateAndOrder(affiliateId: string, orderId: string) {
      return prisma.affiliateConversion.findFirst({
        where: { affiliateId, orderId },
        select: conversionSelect,
      });
    },

    async findPayoutsByAffiliateAndOrder(affiliateId: string, brandId?: string) {
      return prisma.affiliatePayout.findMany({
        where: {
          affiliateId,
          ...(brandId ? { brandId } : {}),
        },
        select: payoutSelect,
      });
    },
  // Dashboard summary (transactional)
  async getDashboardSummary(brandId: string) {
    return prisma.$transaction([
      prisma.affiliate.count({ where: { brandId } }),
      prisma.affiliate.count({ where: { brandId, status: "ACTIVE" } }),
      prisma.affiliateConversion.aggregate({
        where: { brandId },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.affiliateSale.aggregate({
        where: { affiliate: { brandId } },
        _sum: { commission: true },
      }),
      prisma.affiliatePayout.aggregate({
        where: { brandId, status: "PENDING" },
        _sum: { amount: true },
      }),
    ]);
  },

  // List affiliates (with pagination)
  async listAffiliates(where: PrismaWhere<typeof prisma.affiliate.findMany>, skip: number, take: number) {
    return prisma.$transaction([
      prisma.affiliate.count({ where }),
      prisma.affiliate.findMany({
        where,
        select: affiliateSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);
  },

  async getAffiliateById(affiliateId: string, brandId: string) {
    return prisma.affiliate.findFirst({
      where: { id: affiliateId, brandId },
      select: affiliateSelect,
    });
  },

  async createAffiliate(data: PrismaData<typeof prisma.affiliate.create>) {
    return prisma.affiliate.create({ data, select: affiliateSelect });
  },

  async updateAffiliate(affiliateId: string, data: PrismaData<typeof prisma.affiliate.update>) {
    return prisma.affiliate.update({ where: { id: affiliateId }, data, select: affiliateSelect });
  },

  async deactivateAffiliate(affiliateId: string) {
    return prisma.affiliate.update({ where: { id: affiliateId }, data: { status: "INACTIVE" }, select: affiliateSelect });
  },

  async listLinks(affiliateId: string) {
    return prisma.affiliateLink.findMany({
      where: { affiliateId },
      select: linkSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async createLink(data: PrismaData<typeof prisma.affiliateLink.create>) {
    return prisma.affiliateLink.create({ data, select: linkSelect });
  },

  async createConversion(data: PrismaData<typeof prisma.affiliateConversion.create>) {
    return prisma.affiliateConversion.create({ data, select: conversionSelect });
  },

  async requestPayout(data: PrismaData<typeof prisma.affiliatePayout.create>) {
    return prisma.affiliatePayout.create({ data, select: payoutSelect });
  },

  async changePayoutStatus(payoutId: string, updates: PrismaData<typeof prisma.affiliatePayout.update>) {
    return prisma.affiliatePayout.update({ where: { id: payoutId }, data: updates, select: payoutSelect });
  },

  // --- Aggregates ---
  async aggregatePerformance(affiliateIds: string[]) {
    if (!affiliateIds.length) return [];
    return prisma.affiliatePerformance.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: affiliateIds } },
      _sum: { clicks: true, orders: true, revenue: true },
    });
  },

  async aggregateSales(affiliateIds: string[]) {
    if (!affiliateIds.length) return [];
    return prisma.affiliateSale.groupBy({
      by: ["affiliateId"],
      where: { affiliateId: { in: affiliateIds } },
      _sum: { commission: true },
    });
  },

  async aggregatePayouts(affiliateIds: string[]) {
    if (!affiliateIds.length) return [];
    return prisma.affiliatePayout.groupBy({
      by: ["affiliateId", "status"],
      where: { affiliateId: { in: affiliateIds } },
      _sum: { amount: true },
    });
  },
};
