import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export const standPartnerSelect = {
  id: true,
  brandId: true,
  partnerId: true,
  standType: true,
  locationAddress: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  partner: {
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
    },
  },
} satisfies Prisma.StandPartnerSelect;

export type StandPartnerRecord = Prisma.StandPartnerGetPayload<{ select: typeof standPartnerSelect }>;

export interface StandStatsAggregate {
  standPartnerId: string;
  totalUnits: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt: Date | null;
}

async function aggregateStandStats(
  standPartnerIds: string[],
  brandId: string,
): Promise<Map<string, StandStatsAggregate>> {
  if (!standPartnerIds.length) return new Map();

  const unitGroups = await prisma.standUnit.groupBy({
    by: ["standPartnerId"],
    _count: { _all: true },
    where: {
      standPartnerId: { in: standPartnerIds },
      standPartner: { brandId },
    },
  });

  const orderGroups = await prisma.standOrder.groupBy({
    by: ["standPartnerId"],
    _count: { _all: true },
    _sum: { total: true },
    _max: { createdAt: true },
    where: {
      standPartnerId: { in: standPartnerIds },
      brandId,
    },
  });

  const stats = new Map<string, StandStatsAggregate>();

  for (const row of unitGroups) {
    stats.set(row.standPartnerId, {
      standPartnerId: row.standPartnerId,
      totalUnits: row._count._all,
      totalOrders: 0,
      totalRevenue: 0,
      lastOrderAt: null,
    });
  }

  for (const row of orderGroups) {
    const base =
      stats.get(row.standPartnerId) ?? {
        standPartnerId: row.standPartnerId,
        totalUnits: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastOrderAt: null,
      };
    base.totalOrders = row._count._all;
    base.totalRevenue = Number(row._sum.total ?? 0);
    base.lastOrderAt = row._max.createdAt ?? null;
    stats.set(row.standPartnerId, base);
  }

  return stats;
}

async function getDashboardSummary(brandId: string) {
  const [totalPartners, activePartners, unitAgg, orderAgg] = await prisma.$transaction([
    prisma.standPartner.count({ where: { brandId } }),
    prisma.standPartner.count({ where: { brandId, status: "ACTIVE" } }),
    prisma.standUnit.aggregate({
      where: { standPartner: { brandId } },
      _count: { id: true },
    }),
    prisma.standOrder.aggregate({
      where: { brandId },
      _count: { id: true },
      _sum: { total: true },
      _max: { createdAt: true },
    }),
  ]);
  return {
    totalPartners,
    activePartners,
    totalUnits: unitAgg._count.id ?? 0,
    totalOrders: orderAgg._count.id ?? 0,
    totalRevenue: Number(orderAgg._sum.total ?? 0),
    lastOrderAt: orderAgg._max.createdAt ?? null,
  };
}

function listStandPartners(where: Prisma.StandPartnerWhereInput, skip?: number, take?: number) {
  return prisma.$transaction([
    prisma.standPartner.count({ where }),
    prisma.standPartner.findMany({
      where,
      select: standPartnerSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);
}

function getStandPartnerById(id: string, brandId: string) {
  return prisma.standPartner.findFirst({
    where: { id, brandId },
    select: standPartnerSelect,
  });
}

function createStandPartner(data: Prisma.StandPartnerUncheckedCreateInput) {
  return prisma.standPartner.create({
    data,
    select: standPartnerSelect,
  });
}

function updateStandPartner(id: string, data: Prisma.StandPartnerUpdateInput) {
  return prisma.standPartner.update({
    where: { id },
    data,
    select: standPartnerSelect,
  });
}

function deactivateStandPartner(id: string) {
  return prisma.standPartner.update({
    where: { id },
    data: { status: "INACTIVE" },
    select: standPartnerSelect,
  });
}

function findBrandPartnerByIds(partnerId: string, brandId: string) {
  return prisma.partner.findFirst({
    where: { id: partnerId, brandId },
    select: { id: true },
  });
}

export const standRepository = {
  standPartnerSelect,
  aggregateStandStats,
  getDashboardSummary,
  listStandPartners,
  getStandPartnerById,
  createStandPartner,
  updateStandPartner,
  deactivateStandPartner,
  findBrandPartnerByIds,
};
