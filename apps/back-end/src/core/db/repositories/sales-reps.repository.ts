import pkg from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const { Prisma: PrismaNamespace } = pkg;

export type SalesRepListFilters = {
  brandId?: string;
  region?: string;
  status?: string;
};

export type SalesLeadListFilters = {
  repId: string;
  status?: string;
};

export type SalesVisitListFilters = {
  repId: string;
};

export type SalesRepListItemPayload = Prisma.SalesRepGetPayload<{
  include: {
    territories: { select: { id: true } };
  };
}>;

export type SalesRepDetailsPayload = Prisma.SalesRepGetPayload<{
  include: {
    territories: {
      include: {
        territory: true;
      };
    };
    leads: true;
    visits: true;
    quotes: true;
    orders: true;
  };
}>;

export type SalesLeadPayload = Prisma.SalesLeadGetPayload<{}>;
export type SalesVisitPayload = Prisma.SalesVisitGetPayload<{}>;

const salesRepListInclude = {
  territories: { select: { id: true } },
};

function buildSalesRepWhere(filters: SalesRepListFilters): Prisma.SalesRepWhereInput {
  const where: Prisma.SalesRepWhereInput = {};
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.region) where.region = filters.region;
  if (filters.status) where.status = filters.status;
  return where;
}

function buildLeadWhere(filters: SalesLeadListFilters): Prisma.SalesLeadWhereInput {
  const where: Prisma.SalesLeadWhereInput = { repId: filters.repId };
  if (filters.status) where.status = filters.status;
  return where;
}

export async function listSalesReps(
  filters: SalesRepListFilters,
  pagination: { skip: number; take: number },
): Promise<[number, SalesRepListItemPayload[]]> {
  const where = buildSalesRepWhere(filters);
  return prisma.$transaction([
    prisma.salesRep.count({ where }),
    prisma.salesRep.findMany({
      where,
      include: salesRepListInclude,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function getSalesRepDetails(repId: string): Promise<SalesRepDetailsPayload | null> {
  return prisma.salesRep.findUnique({
    where: { id: repId },
    include: {
      territories: {
        include: {
          territory: true,
        },
      },
      leads: true,
      visits: true,
      quotes: true,
      orders: true,
    },
  });
}

export async function createSalesRep(data: Prisma.SalesRepUncheckedCreateInput) {
  return prisma.salesRep.create({ data });
}

export async function updateSalesRep(repId: string, data: Prisma.SalesRepUncheckedUpdateInput) {
  return prisma.salesRep.update({ where: { id: repId }, data });
}

export async function listSalesLeads(
  filters: SalesLeadListFilters,
  pagination: { skip: number; take: number },
): Promise<[number, SalesLeadPayload[]]> {
  const where = buildLeadWhere(filters);
  return prisma.$transaction([
    prisma.salesLead.count({ where }),
    prisma.salesLead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function createSalesLead(data: Prisma.SalesLeadUncheckedCreateInput) {
  const payload = {
    ...data,
    score: typeof data.score === "number" ? new PrismaNamespace.Decimal(data.score) : data.score,
  };
  return prisma.salesLead.create({ data: payload });
}

export async function listSalesVisits(
  filters: SalesVisitListFilters,
  pagination: { skip: number; take: number },
): Promise<[number, SalesVisitPayload[]]> {
  return prisma.$transaction([
    prisma.salesVisit.count({ where: { repId: filters.repId } }),
    prisma.salesVisit.findMany({
      where: { repId: filters.repId },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);
}

export async function createSalesVisit(data: Prisma.SalesVisitUncheckedCreateInput) {
  return prisma.salesVisit.create({ data });
}

export async function createCrmTask(data: Prisma.CRMTaskUncheckedCreateInput) {
  return prisma.cRMTask.create({ data });
}

export async function createSalesPlanInsight(data: Prisma.AIInsightUncheckedCreateInput) {
  return prisma.aIInsight.create({ data });
}

export async function createSalesRepKpiSnapshot(
  data: Prisma.SalesRepKpiSnapshotUncheckedCreateInput,
) {
  return prisma.salesRepKpiSnapshot.create({ data });
}

export async function getSalesKpiStats(repId: string) {
  const [leadCount, visitCount, orderAggregate] = await prisma.$transaction([
    prisma.salesLead.count({ where: { repId } }),
    prisma.salesVisit.count({ where: { repId } }),
    prisma.salesOrder.aggregate({
      where: { repId },
      _count: { id: true },
      _sum: { total: true },
    }),
  ]);
  return { leadCount, visitCount, orderAggregate };
}

export async function findSalesRepId(repId: string) {
  return prisma.salesRep.findUnique({ where: { id: repId }, select: { id: true, brandId: true, userId: true } });
}

export async function listRecentSalesLeads(repId: string, take: number) {
  return prisma.salesLead.findMany({
    where: { repId },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function listRecentSalesVisits(repId: string, take: number) {
  return prisma.salesVisit.findMany({
    where: { repId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
