import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const partnerSelect = {
  id: true,
  brandId: true,
  type: true,
  name: true,
  country: true,
  city: true,
  status: true,
  settingsJson: true,
  tier: {
    select: {
      id: true,
      name: true,
      benefits: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartnerSelect;

const dealerKpiSelect = {
  id: true,
  partnerId: true,
  brandId: true,
  totalOrders: true,
  totalRevenue: true,
  totalUnits: true,
  activeStands: true,
  engagementScore: true,
  lastOrderAt: true,
} satisfies Prisma.DealerKpiSelect;

export type PartnerPayload = Prisma.PartnerGetPayload<{ select: typeof partnerSelect }>;
export type DealerKpiPayload = Prisma.DealerKpiGetPayload<{ select: typeof dealerKpiSelect }>;
export type DealerKpiListPayload = Prisma.DealerKpiGetPayload<{
  include: { partner: { select: { name: true } } };
}>;
export type DashboardOrderAggregatePayload = number;
export type PartnerWhereInput = Prisma.PartnerWhereInput;
export type DealerKpiWhereInput = Prisma.DealerKpiWhereInput;

export type DashboardSummaryAggregates = {
  totalPartners: number;
  activePartners: number;
  ordersAgg: number;
  totalStands: number;
  topCountries: Array<Prisma.PartnerGroupByOutputType>;
};

export async function getDashboardSummaryAggregates(
  brandId: string,
): Promise<DashboardSummaryAggregates> {
  const [totalPartners, activePartners, ordersAgg, totalStands, topCountries] =
    await prisma.$transaction([
      prisma.partner.count({ where: { brandId } }),
      prisma.partner.count({ where: { brandId, status: "ACTIVE" } }),
      prisma.partnerOrder.count({
        where: { brandId },
      }),
      prisma.stand.count({ where: { brandId } }),
      prisma.partner.groupBy({
        by: ["country"],
        where: { brandId, country: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 3,
      }),
    ]);

  return {
    totalPartners,
    activePartners,
    ordersAgg,
    totalStands,
    topCountries: topCountries as Prisma.PartnerGroupByOutputType[],
  };
}

export async function listPartners(
  where: Prisma.PartnerWhereInput,
  pagination: { skip: number; take: number },
): Promise<[number, PartnerPayload[]]> {
  return prisma.$transaction([
    prisma.partner.count({ where }),
    prisma.partner.findMany({
      where,
      select: partnerSelect,
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function findPartnerByIdAndBrand(
  partnerId: string,
  brandId: string,
): Promise<PartnerPayload | null> {
  return prisma.partner.findFirst({
    where: { id: partnerId, brandId },
    select: partnerSelect,
  });
}

export async function findPartnerByBrandAndName(
  brandId: string,
  name: string,
): Promise<PartnerPayload | null> {
  return prisma.partner.findFirst({
    where: { brandId, name },
    select: partnerSelect,
  });
}

export async function createPartnerRecord(data: Prisma.PartnerUncheckedCreateInput) {
  return prisma.partner.create({
    data,
    select: partnerSelect,
  });
}

export async function updatePartnerRecord(
  partnerId: string,
  data: Prisma.PartnerUncheckedUpdateInput,
) {
  return prisma.partner.update({
    where: { id: partnerId },
    data,
    select: partnerSelect,
  });
}

export async function deactivatePartnerRecord(partnerId: string) {
  return prisma.partner.update({
    where: { id: partnerId },
    data: { status: "INACTIVE" },
    select: partnerSelect,
  });
}

export async function listDealerKpis(
  where: Prisma.DealerKpiWhereInput,
  pagination: { skip: number; take: number },
): Promise<[number, DealerKpiListPayload[]]> {
  return prisma.$transaction([
    prisma.dealerKpi.count({ where }),
    prisma.dealerKpi.findMany({
      where,
      include: { partner: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function findDealerKpi(partnerId: string, brandId: string) {
  return prisma.dealerKpi.findUnique({
    where: { partnerId_brandId: { partnerId, brandId } },
    select: dealerKpiSelect,
  });
}

export type DealerKpiData = {
  totalOrders: number;
  totalRevenue: number;
  totalUnits: number;
  activeStands: number;
  engagementScore: number;
  lastOrderAt: Date | null;
};

export async function computeDealerKpiData(partnerId: string, brandId: string) {
  // Use Prisma.validator to ensure type safety for aggregate args
    // Only count is possible for PartnerOrder; all other fields are not present in schema.
    const [orderCount, activeStands] = await Promise.all([
      prisma.partnerOrder.count({
        where: { partnerId, brandId },
      }),
      prisma.stand.count({
        where: {
          brandId,
          standPartner: {
            partnerId,
          },
          status: "ACTIVE",
        },
      }),
    ]);

    const totalOrders = orderCount;
    const totalRevenue = 0;
    const totalUnits = 0;
    const lastOrderAt = null;
    const engagementScore = Math.min(
      100,
      totalOrders * 2 + totalRevenue / 1000 + activeStands * 3,
    );

    return { totalOrders, totalRevenue, totalUnits, activeStands, engagementScore, lastOrderAt };
}

export async function upsertDealerKpi(
  partnerId: string,
  brandId: string,
  data: DealerKpiData,
) {
  return prisma.dealerKpi.upsert({
    where: { partnerId_brandId: { partnerId, brandId } },
    create: {
      partnerId,
      brandId,
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      totalUnits: data.totalUnits,
      activeStands: data.activeStands,
      engagementScore: data.engagementScore,
      lastOrderAt: data.lastOrderAt,
    },
    update: {
      totalOrders: data.totalOrders,
      totalRevenue: data.totalRevenue,
      totalUnits: data.totalUnits,
      activeStands: data.activeStands,
      engagementScore: data.engagementScore,
      lastOrderAt: data.lastOrderAt,
    },
    select: dealerKpiSelect,
  });
}

export async function findPartnerName(partnerId: string) {
  return prisma.partner.findUnique({
    where: { id: partnerId },
    select: { name: true },
  });
}
