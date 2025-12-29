import type { Prisma, PartnerContract, PartnerUser } from "@prisma/client";
import { prisma } from "../../prisma.js";

const partnerSelect = {
  id: true,
  brandId: true,
  type: true,
  name: true,
  country: true,
  city: true,
  status: true,
  tierId: true,
  tier: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PartnerSelect;

const partnerMinimalSelect = {
  id: true,
  brandId: true,
} satisfies Prisma.PartnerSelect;

const partnerUserInclude = {
  user: {
    select: {
      id: true,
      email: true,
    },
  },
} satisfies Prisma.PartnerUserInclude;

const contractSelect = {
  id: true,
  partnerId: true,
  startDate: true,
  endDate: true,
  termsJson: true,
  createdAt: true,
  updatedAt: true,
  partner: { select: { brandId: true } },
} satisfies Prisma.PartnerContractSelect;

const pricingSelect = {
  id: true,
  partnerId: true,
  productId: true,
  netPrice: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
  product: { select: { name: true } },
} satisfies Prisma.PartnerPricingSelect;

export type PartnerRecord = Prisma.PartnerGetPayload<{ select: typeof partnerSelect }>;
export type PartnerMinimalRecord = Prisma.PartnerGetPayload<{ select: typeof partnerMinimalSelect }>;
export type PartnerContractRecord = Prisma.PartnerContractGetPayload<{ select: typeof contractSelect }>;
type PartnerContractDates = Prisma.PartnerContractGetPayload<{ select: { startDate: true; endDate: true } }>;
export type PartnerPricingRecord = Prisma.PartnerPricingGetPayload<{ select: typeof pricingSelect }>;
type PartnerPricingIdRecord = { id: string };
export type PartnerUserRecord = Prisma.PartnerUserGetPayload<{ include: typeof partnerUserInclude }>;
type PartnerOrderLatestRecord = Prisma.PartnerOrderGetPayload<{ select: { createdAt: true } }>;
type PartnerOrderAggregateSummary = Awaited<ReturnType<typeof prisma.partnerOrder.aggregate>>;
type PartnerOrderGroupByPartnerId = Awaited<ReturnType<typeof prisma.partnerOrder.groupBy>>;
type PartnerOrderItemSum = Awaited<ReturnType<typeof prisma.partnerOrderItem.aggregate>>;
type WhiteLabelOrderSum = Awaited<ReturnType<typeof prisma.whiteLabelOrder.aggregate>>;
type AffiliatePerformanceSum = Awaited<ReturnType<typeof prisma.affiliatePerformance.aggregate>>;
type PartnerOverviewResult = [
  number,
  PartnerContractDates | null,
  number,
  PartnerOrderAggregateSummary,
];
type PartnerStatsAggregatesResult = [
  PartnerOrderGroupByPartnerId,
  PartnerOrderItemSum,
  number,
  WhiteLabelOrderSum,
  PartnerOrderLatestRecord | null,
];

/**
 * Atomically creates or updates a partner contract.
 * @param contractId - If provided, updates; else creates new contract.
 * @param data - Prisma.PartnerContractCreateInput or UpdateInput (internal)
 * @returns PartnerContract with contractSelect shape
 */
type CreateContractArgs = { contractId?: null | undefined; createData: Prisma.PartnerContractCreateInput };
type UpdateContractArgs = { contractId: string; updateData: Prisma.PartnerContractUpdateInput };
type ContractMutationArgs = CreateContractArgs | UpdateContractArgs;

async function createOrUpdatePartnerContractAtomic(args: ContractMutationArgs): Promise<PartnerContractRecord> {
  return prisma.$transaction(async (tx) => {
    if (isUpdateContractArgs(args)) {
      return tx.partnerContract.update({
        where: { id: args.contractId },
        data: args.updateData,
        select: contractSelect,
      });
    }
    return tx.partnerContract.create({
      data: args.createData,
      select: contractSelect,
    });
  });
}

function isUpdateContractArgs(args: ContractMutationArgs): args is UpdateContractArgs {
  return "contractId" in args && typeof args.contractId === "string";
}
/**
 * Atomically upserts partner pricing for (partnerId, productId).
 * @param partnerId - Partner ID
 * @param productId - Product ID
 * @param netPrice - Net price value
 * @param currency - Currency string (optional)
 * @returns PartnerPricing with pricingSelect shape
 */
async function upsertPartnerPricingAtomic({
  partnerId,
  productId,
  netPrice,
  currency,
}: {
  partnerId: string;
  productId: string;
  netPrice: number;
  currency?: string | null;
}): Promise<PartnerPricingRecord> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.partnerPricing.findFirst({
      where: { partnerId, productId },
      select: { id: true },
    });
    if (existing) {
      return tx.partnerPricing.update({
        where: { id: existing.id },
        data: { netPrice, currency },
        select: pricingSelect,
      });
    }
    return tx.partnerPricing.create({
      data: {
        partner: { connect: { id: partnerId } },
        product: { connect: { id: productId } },
        netPrice,
        currency,
      },
      select: pricingSelect,
    });
  });
}
/**
 * Atomically creates a user (if needed) and links to a partner as a PartnerUser.
 * @param userData - If provided, creates a new user; otherwise links existing userId.
 * @param userId - If userData is not provided, must provide userId to link.
 * @param partnerId - Partner to link.
 * @param role - Role to assign.
 * @returns PartnerUser with user include (same as createPartnerUser)
 */
export async function attachUserToPartnerAtomic({
  userData,
  userId,
  partnerId,
  role,
}: {
  userData?: { email: string; password: string; role: string };
  userId?: string;
  partnerId: string;
  role: string;
}): Promise<PartnerUserRecord> {
  return prisma.$transaction(async (tx) => {
    if (userData) {
      const createdUser = await tx.user.create({ data: userData });
      return tx.partnerUser.create({
        data: {
          partner: { connect: { id: partnerId } },
          user: { connect: { id: createdUser.id } },
          role,
        },
        include: partnerUserInclude,
      });
    }
    if (!userId) throw new Error("userId is required if userData is not provided");
    return tx.partnerUser.create({
      data: {
        partner: { connect: { id: partnerId } },
        user: { connect: { id: userId } },
        role,
      },
      include: partnerUserInclude,
    });
  });
}
export const partnersRepository = {
  attachUserToPartnerAtomic,
  listPartners(where: Prisma.PartnerWhereInput, skip: number, take: number): Promise<[number, PartnerRecord[]]> {
    return prisma.$transaction([
      prisma.partner.count({ where }),
      prisma.partner.findMany({
        where,
        select: partnerSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);
  },

  getPartnerById(partnerId: string, brandId: string): Promise<PartnerRecord | null> {
    return prisma.partner.findFirst({
      where: { id: partnerId, brandId },
      select: partnerSelect,
    });
  },

  getPartnerMinimal(partnerId: string, brandId: string): Promise<PartnerMinimalRecord | null> {
    return prisma.partner.findFirst({
      where: { id: partnerId, brandId },
      select: partnerMinimalSelect,
    });
  },

  createPartner(data: Prisma.PartnerCreateInput): Promise<PartnerRecord> {
    return prisma.partner.create({ data, select: partnerSelect });
  },

  updatePartner(partnerId: string, data: Prisma.PartnerUpdateInput): Promise<PartnerRecord> {
    return prisma.partner.update({
      where: { id: partnerId },
      data,
      select: partnerSelect,
    });
  },

  deactivatePartner(partnerId: string): Promise<PartnerRecord> {
    return prisma.partner.update({
      where: { id: partnerId },
      data: { status: "INACTIVE" },
      select: partnerSelect,
    });
  },

  getPartnerOverview(partnerId: string, brandId: string): Promise<PartnerOverviewResult> {
    return prisma.$transaction([
      prisma.partnerContract.count({ where: { partnerId } }),
      prisma.partnerContract.findFirst({
        where: { partnerId },
        orderBy: { startDate: "desc" },
        select: { startDate: true, endDate: true },
      }),
      prisma.partnerPricing.count({ where: { partnerId } }),
      prisma.partnerOrder.aggregate({
        where: { partnerId, brandId },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);
  },

  getPartnerStatsAggregates(partnerId: string, brandId: string): Promise<PartnerStatsAggregatesResult> {
    return prisma.$transaction([
      prisma.partnerOrder.groupBy({
        by: ["partnerId"],
        where: { partnerId, brandId },
        orderBy: { partnerId: "asc" },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.partnerOrderItem.aggregate({
        where: {
          order: { partnerId, brandId },
        },
        _sum: { quantity: true },
      }),
      prisma.standPartner.count({
        where: { partnerId, brandId },
      }),
      prisma.whiteLabelOrder.aggregate({
        where: { wlBrand: { ownerPartnerId: partnerId } },
        _sum: { total: true },
      }),
      prisma.partnerOrder.findFirst({
        where: { partnerId, brandId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);
  },

  countAffiliateLinksByBrand(brandId: string): Promise<number> {
    return prisma.affiliateLink.count({
      where: { affiliate: { brandId } },
    });
  },

  aggregateAffiliatePerformanceByBrand(brandId: string): Promise<AffiliatePerformanceSum> {
    return prisma.affiliatePerformance.aggregate({
      where: { affiliate: { brandId } },
      _sum: { revenue: true },
    });
  },

  listPartnerContracts(where: Prisma.PartnerContractWhereInput, skip: number, take: number): Promise<[number, PartnerContractRecord[]]> {
    return prisma.$transaction([
      prisma.partnerContract.count({ where }),
      prisma.partnerContract.findMany({
        where,
        select: contractSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);
  },

  getPartnerContract(contractId: string, partnerId: string): Promise<PartnerContractRecord | null> {
    return prisma.partnerContract.findFirst({
      where: { id: contractId, partnerId },
      select: contractSelect,
    });
  },

  createPartnerContract(data: Prisma.PartnerContractCreateInput): Promise<PartnerContractRecord> {
    return prisma.partnerContract.create({ data, select: contractSelect });
  },

  updatePartnerContract(contractId: string, data: Prisma.PartnerContractUpdateInput): Promise<PartnerContractRecord> {
    return prisma.partnerContract.update({ where: { id: contractId }, data, select: contractSelect });
  },

  deletePartnerContract(contractId: string): Promise<PartnerContract> {
    return prisma.partnerContract.delete({ where: { id: contractId } });
  },

  listPartnerPricing(where: Prisma.PartnerPricingWhereInput, skip: number, take: number): Promise<[number, PartnerPricingRecord[]]> {
    return prisma.$transaction([
      prisma.partnerPricing.count({ where }),
      prisma.partnerPricing.findMany({
        where,
        select: pricingSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);
  },

  getPartnerPricing(partnerId: string, productId: string): Promise<PartnerPricingIdRecord | null> {
    return prisma.partnerPricing.findFirst({
      where: { partnerId, productId },
      select: { id: true },
    });
  },

  createPartnerPricing(data: Prisma.PartnerPricingCreateInput): Promise<PartnerPricingRecord> {
    return prisma.partnerPricing.create({ data, select: pricingSelect });
  },

  updatePartnerPricing(pricingId: string, data: Prisma.PartnerPricingUpdateInput): Promise<PartnerPricingRecord> {
    return prisma.partnerPricing.update({ where: { id: pricingId }, data, select: pricingSelect });
  },

  listPartnerUsers(where: Prisma.PartnerUserWhereInput, skip: number, take: number): Promise<[number, PartnerUserRecord[]]> {
    return prisma.$transaction([
      prisma.partnerUser.count({ where }),
      prisma.partnerUser.findMany({
        where,
        include: partnerUserInclude,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
  },

  getPartnerUser(partnerUserId: string, partnerId: string): Promise<PartnerUserRecord | null> {
    return prisma.partnerUser.findFirst({
      where: { id: partnerUserId, partnerId },
      include: partnerUserInclude,
    });
  },

  getPartnerUserByPartnerAndUser(partnerId: string, userId: string): Promise<PartnerUser | null> {
    return prisma.partnerUser.findFirst({
      where: { partnerId, userId },
    });
  },

  createPartnerUser(data: Prisma.PartnerUserCreateInput): Promise<PartnerUserRecord> {
    return prisma.partnerUser.create({ data, include: partnerUserInclude });
  },

  updatePartnerUser(partnerUserId: string, data: Prisma.PartnerUserUpdateInput): Promise<PartnerUserRecord> {
    return prisma.partnerUser.update({
      where: { id: partnerUserId },
      data,
      include: partnerUserInclude,
    });
  },

  deletePartnerUser(partnerUserId: string): Promise<Prisma.PartnerUserGetPayload<{ select: { id: true } }>> {
    return prisma.partnerUser.delete({
      where: { id: partnerUserId },
      select: { id: true },
    });
  },

  getBrandById(brandId: string): Promise<Prisma.BrandGetPayload<{ select: { id: true; defaultCurrency: true } }> | null> {
    return prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, defaultCurrency: true } });
  },

  getBrandCurrency(brandId: string): Promise<Prisma.BrandGetPayload<{ select: { defaultCurrency: true } }> | null> {
    return prisma.brand.findUnique({
      where: { id: brandId },
      select: { defaultCurrency: true },
    });
  },

  getProductForBrand(productId: string, brandId: string): Promise<Prisma.BrandProductGetPayload<{ select: { id: true } }> | null> {
    return prisma.brandProduct.findFirst({
      where: { id: productId, brandId },
      select: { id: true },
    });
  },

  getTierForBrand(tierId: string, brandId: string): Promise<Prisma.PartnerTierGetPayload<{ select: { id: true } }> | null> {
    return prisma.partnerTier.findFirst({
      where: { id: tierId, brandId },
      select: { id: true },
    });
  },

  findPartnerByName(brandId: string, name: string, excludeId?: string): Promise<{ id: string } | null> {
    const where: Prisma.PartnerWhereInput = {
      brandId,
      name: { equals: name, mode: "insensitive" },
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    return prisma.partner.findFirst({
      where,
      select: { id: true },
    });
  },

  getUserById(userId: string): Promise<Prisma.UserGetPayload<{ select: { id: true } }> | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
  },
  upsertPartnerPricingAtomic,
  createOrUpdatePartnerContractAtomic,
};
