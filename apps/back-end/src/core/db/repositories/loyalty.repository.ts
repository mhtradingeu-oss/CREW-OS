import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";
import { buildPagination } from "../../utils/pagination.js";

const programSelect = {
  id: true,
  brandId: true,
  name: true,
  description: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LoyaltyProgramSelect;

const tierSelect = {
  id: true,
  brandId: true,
  programId: true,
  name: true,
  minPoints: true,
  maxPoints: true,
  benefitsDescription: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LoyaltyTierSelect;

const rewardSelect = {
  id: true,
  brandId: true,
  programId: true,
  name: true,
  description: true,
  costPoints: true,
  pointsCost: true,
  rewardType: true,
  payloadJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LoyaltyRewardSelect;

const customerSelect = {
  id: true,
  brandId: true,
  programId: true,
  userId: true,
  personId: true,
  pointsBalance: true,
  tierId: true,
  tier: true,
  tierInfo: {
    select: {
      id: true,
      name: true,
    },
  },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.LoyaltyCustomerSelect;

const loyaltyInsightSelect = {
  id: true,
  brandId: true,
  os: true,
  entityType: true,
  entityId: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

type PaginationParams = { page?: number; pageSize?: number };

function normalizePagination(pagination: PaginationParams = {}) {
  const page = Math.max(1, pagination.page ?? 1);
  const pageSize = Math.min(pagination.pageSize ?? 20, 100);
  const { skip, take } = buildPagination({ page, pageSize });
  return { page, pageSize: take, skip, take };
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type LoyaltyProgramPayload = Prisma.LoyaltyProgramGetPayload<{
  select: typeof programSelect;
}>;
export type LoyaltyTierPayload = Prisma.LoyaltyTierGetPayload<{ select: typeof tierSelect }>;
export type LoyaltyRewardPayload = Prisma.LoyaltyRewardGetPayload<{ select: typeof rewardSelect }>;
export type LoyaltyCustomerPayload = Prisma.LoyaltyCustomerGetPayload<{
  select: typeof customerSelect;
}>;
export type LoyaltyCustomerWithProgramTiersPayload = Prisma.LoyaltyCustomerGetPayload<{
  select: {
    id: true;
    brandId: true;
    programId: true;
    tierId: true;
    tier: true;
    pointsBalance: true;
    program: {
      select: {
        id: true;
        brandId: true;
        tiers: {
          select: {
            id: true;
            name: true;
            minPoints: true;
            maxPoints: true;
          };
          orderBy: { minPoints: "asc" };
        };
      };
    };
  };
}>;
export type LoyaltyInsightPayload = Prisma.AIInsightGetPayload<{
  select: typeof loyaltyInsightSelect;
}>;
export type LoyaltyInsightCreateInput = Prisma.AIInsightUncheckedCreateInput;

type LoyaltyPointsDeltaCallback = (
  tx: Prisma.TransactionClient,
  updated: LoyaltyCustomerPayload,
) => Promise<void>;

type LoyaltyPointsDeltaArgs = {
  customerId: string;
  delta: number;
  reason: string;
  brandId?: string | null;
  programId: string;
  callback?: LoyaltyPointsDeltaCallback;
};

export async function listUserLoyalties(
  filters: { brandId?: string; programId?: string } = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LoyaltyCustomerPayload>> {
  const { page, pageSize, skip, take } = normalizePagination(pagination);
  const where: Prisma.LoyaltyCustomerWhereInput = {};
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.programId) where.programId = filters.programId;
  const [total, items] = await prisma.$transaction([
    prisma.loyaltyCustomer.count({ where }),
    prisma.loyaltyCustomer.findMany({
      where,
      select: customerSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function findUserLoyaltyById(id: string): Promise<LoyaltyCustomerPayload | null> {
  return prisma.loyaltyCustomer.findUnique({ where: { id }, select: customerSelect });
}

export async function createUserLoyalty(
  data: Prisma.LoyaltyCustomerUncheckedCreateInput,
): Promise<LoyaltyCustomerPayload> {
  return prisma.loyaltyCustomer.create({ data, select: customerSelect });
}

export async function updateUserLoyalty(
  id: string,
  data: Prisma.LoyaltyCustomerUncheckedUpdateInput,
): Promise<LoyaltyCustomerPayload> {
  return prisma.loyaltyCustomer.update({ where: { id }, data, select: customerSelect });
}

export async function deleteUserLoyalty(id: string): Promise<void> {
  await prisma.loyaltyCustomer.delete({ where: { id } });
}

export async function getDashboardSummary(brandId: string) {
  const programWhere: Prisma.LoyaltyProgramWhereInput = { brandId };
  const customerWhere: Prisma.LoyaltyCustomerWhereInput = { brandId };
  const rewardWhere: Prisma.LoyaltyRewardWhereInput = { brandId };
  const [programs, customerAgg, rewards, redemptionAgg] = await prisma.$transaction([
    prisma.loyaltyProgram.count({ where: programWhere }),
    prisma.loyaltyCustomer.aggregate({
      where: customerWhere,
      _count: { id: true },
      _sum: { pointsBalance: true },
    }),
    prisma.loyaltyReward.count({ where: rewardWhere }),
    prisma.rewardRedemption.aggregate({
      where: { program: { brandId } },
      _count: { id: true },
      _sum: { pointsSpent: true },
    }),
  ]);
  return {
    totalPrograms: programs,
    totalCustomers: customerAgg._count.id ?? 0,
    totalPoints: Number(customerAgg._sum.pointsBalance ?? 0),
    totalRewards: rewards,
    totalRedemptions: redemptionAgg._count.id ?? 0,
    pointsSpent: Number(redemptionAgg._sum.pointsSpent ?? 0),
  };
}

export async function listPrograms(
  filters: { brandId?: string } = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LoyaltyProgramPayload>> {
  const { page, pageSize, skip, take } = normalizePagination(pagination);
  const where: Prisma.LoyaltyProgramWhereInput = {};
  if (filters.brandId) where.brandId = filters.brandId;
  const [total, items] = await prisma.$transaction([
    prisma.loyaltyProgram.count({ where }),
    prisma.loyaltyProgram.findMany({
      where,
      select: programSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function findProgramById(id: string): Promise<LoyaltyProgramPayload | null> {
  return prisma.loyaltyProgram.findUnique({ where: { id }, select: programSelect });
}

export async function createProgram(
  data: Prisma.LoyaltyProgramUncheckedCreateInput,
): Promise<LoyaltyProgramPayload> {
  return prisma.loyaltyProgram.create({ data, select: programSelect });
}

export async function updateProgram(
  id: string,
  data: Prisma.LoyaltyProgramUncheckedUpdateInput,
): Promise<LoyaltyProgramPayload> {
  return prisma.loyaltyProgram.update({ where: { id }, data, select: programSelect });
}

export async function deleteProgram(id: string): Promise<void> {
  await prisma.loyaltyProgram.delete({ where: { id } });
}

export async function listProgramTiers(
  programId: string,
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LoyaltyTierPayload>> {
  const { page, pageSize, skip, take } = normalizePagination(pagination);
  const [total, items] = await prisma.$transaction([
    prisma.loyaltyTier.count({ where: { programId } }),
    prisma.loyaltyTier.findMany({
      where: { programId },
      select: tierSelect,
      orderBy: { minPoints: "asc" },
      skip,
      take,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createProgramTier(
  data: Prisma.LoyaltyTierUncheckedCreateInput,
): Promise<LoyaltyTierPayload> {
  return prisma.loyaltyTier.create({ data, select: tierSelect });
}

export async function listProgramRewards(
  programId: string,
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LoyaltyRewardPayload>> {
  const { page, pageSize, skip, take } = normalizePagination(pagination);
  const [total, items] = await prisma.$transaction([
    prisma.loyaltyReward.count({ where: { programId } }),
    prisma.loyaltyReward.findMany({
      where: { programId },
      select: rewardSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items, total, page, pageSize };
}

export async function createProgramReward(
  data: Prisma.LoyaltyRewardUncheckedCreateInput,
): Promise<LoyaltyRewardPayload> {
  return prisma.loyaltyReward.create({ data, select: rewardSelect });
}

export async function findProgramRewardById(id: string): Promise<LoyaltyRewardPayload | null> {
  return prisma.loyaltyReward.findUnique({ where: { id }, select: rewardSelect });
}

export async function findCustomerWithProgramAndTiers(
  customerId: string,
): Promise<LoyaltyCustomerWithProgramTiersPayload | null> {
  return prisma.loyaltyCustomer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      brandId: true,
      programId: true,
      tierId: true,
      tier: true,
      pointsBalance: true,
      program: {
        select: {
          id: true,
          brandId: true,
          tiers: {
            select: {
              id: true,
              name: true,
              minPoints: true,
              maxPoints: true,
            },
            orderBy: { minPoints: "asc" },
          },
        },
      },
    },
  });
}

export async function updateCustomerTier(
  customerId: string,
  tierId: string | null,
  tierName: string | null,
): Promise<LoyaltyCustomerPayload> {
  return prisma.loyaltyCustomer.update({
    where: { id: customerId },
    data: { tierId, tier: tierName ?? null },
    select: customerSelect,
  });
}

export async function applyPointsDelta(args: LoyaltyPointsDeltaArgs): Promise<LoyaltyCustomerPayload> {
  const updated = await prisma.$transaction(async (tx) => {
    const updatedCustomer = await tx.loyaltyCustomer.update({
      where: { id: args.customerId },
      data: { pointsBalance: { increment: args.delta } },
      select: customerSelect,
    });
    await tx.loyaltyTransaction.create({
      data: {
        brandId: args.brandId ?? null,
        customerId: args.customerId,
        programId: args.programId,
        pointsChange: args.delta,
        reason: args.reason,
      },
    });
    if (args.callback) {
      await args.callback(tx, updatedCustomer);
    }
    return updatedCustomer;
  });
  return updated;
}

export async function redeemRewardTransaction(args: {
  customerId: string;
  rewardId: string;
  programId: string;
  pointsCost: number;
  metadataJson?: string | null;
  brandId?: string | null;
  reason: string;
}): Promise<LoyaltyCustomerPayload> {
  return applyPointsDelta({
    customerId: args.customerId,
    delta: -args.pointsCost,
    reason: args.reason,
    brandId: args.brandId,
    programId: args.programId,
    callback: async (tx) => {
      await tx.rewardRedemption.create({
        data: {
          customerId: args.customerId,
          rewardId: args.rewardId,
          programId: args.programId,
          pointsSpent: args.pointsCost,
          status: "COMPLETED",
          metadataJson: args.metadataJson ?? null,
        },
      });
    },
  });
}

export async function createLoyaltyInsight(
  data: LoyaltyInsightCreateInput,
): Promise<LoyaltyInsightPayload> {
  return prisma.aIInsight.create({ data, select: loyaltyInsightSelect });
}

export async function listLoyaltyInsights(
  filters: { brandId?: string; entityId?: string; entityType?: string } = {},
  pagination: PaginationParams = {},
): Promise<PaginatedResult<LoyaltyInsightPayload>> {
  const { page, pageSize, skip, take } = normalizePagination(pagination);
  const where: Prisma.AIInsightWhereInput = { os: "loyalty" };
  if (filters.brandId) where.brandId = filters.brandId;
  if (filters.entityId) where.entityId = filters.entityId;
  if (filters.entityType) where.entityType = filters.entityType;
  const [total, items] = await prisma.$transaction([
    prisma.aIInsight.count({ where }),
    prisma.aIInsight.findMany({
      where,
      select: loyaltyInsightSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { items, total, page, pageSize };
}
