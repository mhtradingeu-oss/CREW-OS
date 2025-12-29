/**
 * LOYALTY SERVICE — MH-OS v2
 * Spec: docs/os/11_loyalty-program.md (MASTER_INDEX)
 */
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import {
  emitLoyaltyCreated,
  emitLoyaltyRewardRedeemed,
  emitLoyaltyTierChanged,
} from "./loyalty.events.js";
import type {
  CreateLoyaltyInput,
  LoyaltyCustomerRecord,
  UpdateLoyaltyInput,
  LoyaltyDashboardSummary,
  LoyaltyProgramDTO,
  LoyaltyRewardDTO,
  LoyaltyTierDTO,
  LoyaltyActionContext,
  CreateLoyaltyProgramInput,
  CreateLoyaltyTierInput,
  CreateLoyaltyRewardInput,
  RedeemRewardInput,
  RedeemRewardResult,
} from "./loyalty.types.js";
import {
  applyPointsDelta,
  createLoyaltyInsight,
  createProgram,
  createProgramReward,
  createProgramTier,
  createUserLoyalty,
  deleteUserLoyalty,
  findCustomerWithProgramAndTiers,
  findProgramById,
  findProgramRewardById,
  findUserLoyaltyById,
  getDashboardSummary,
  listProgramRewards,
  listProgramTiers,
  listPrograms as listProgramRecords,
  listUserLoyalties,
  LoyaltyCustomerPayload,
  LoyaltyInsightCreateInput,
  LoyaltyInsightPayload,
  LoyaltyProgramPayload,
  LoyaltyRewardPayload,
  LoyaltyTierPayload,
  redeemRewardTransaction,
  updateCustomerTier,
  updateUserLoyalty,
} from "../../core/db/repositories/loyalty.repository.js";

function normalizePayload(value?: Record<string, unknown> | string | null) {
  if (!value) return null;
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function mapProgram(record: LoyaltyProgramPayload): LoyaltyProgramDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    name: record.name,
    description: record.description ?? null,
    status: record.status ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapTier(record: LoyaltyTierPayload): LoyaltyTierDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    programId: record.programId,
    name: record.name,
    minPoints: record.minPoints,
    maxPoints: record.maxPoints ?? null,
    benefitsDescription: record.benefitsDescription ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapReward(record: LoyaltyRewardPayload): LoyaltyRewardDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    programId: record.programId ?? undefined,
    name: record.name,
    description: record.description ?? null,
    pointsCost: record.pointsCost ?? record.costPoints ?? null,
    rewardType: record.rewardType ?? null,
    payloadJson: record.payloadJson ?? null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapCustomer(record: LoyaltyCustomerPayload): LoyaltyCustomerRecord {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    programId: record.programId,
    userId: record.userId ?? undefined,
    personId: record.personId ?? undefined,
    pointsBalance: record.pointsBalance,
    tierId: record.tierId ?? undefined,
    tier: record.tier ?? undefined,
    tierName: record.tierInfo?.name ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

class LoyaltyService {
  async dashboardSummary(brandId: string): Promise<LoyaltyDashboardSummary> {
    return getDashboardSummary(brandId);
  }

  async list(
    params: { brandId?: string; programId?: string; page?: number; pageSize?: number } = {},
  ) {
    const { items, total, page, pageSize } = await listUserLoyalties(
      { brandId: params.brandId, programId: params.programId },
      { page: params.page, pageSize: params.pageSize },
    );
    return {
      items: items.map(mapCustomer),
      total,
      page,
      pageSize,
    };
  }

  async getById(id: string): Promise<LoyaltyCustomerRecord> {
    const record = await findUserLoyaltyById(id);
    if (!record) throw notFound("Loyalty customer not found");
    return mapCustomer(record);
  }

  async create(input: CreateLoyaltyInput): Promise<LoyaltyCustomerRecord> {
    if (!input.programId) throw badRequest("programId is required");
    const created = await createUserLoyalty({
      brandId: input.brandId ?? null,
      programId: input.programId,
      userId: input.userId ?? null,
      personId: input.personId ?? null,
      pointsBalance: input.pointsBalance ?? 0,
      tier: input.tier ?? null,
    });
    await emitLoyaltyCreated(
      { id: created.id, brandId: created.brandId ?? undefined, programId: created.programId },
      { brandId: created.brandId ?? undefined, source: "api" },
    );
    return mapCustomer(created);
  }

  async update(id: string, input: UpdateLoyaltyInput): Promise<LoyaltyCustomerRecord> {
    const existing = await findUserLoyaltyById(id);
    if (!existing) throw notFound("Loyalty customer not found");
    const updated = await updateUserLoyalty(id, {
      brandId: input.brandId ?? existing.brandId ?? null,
      programId: input.programId ?? existing.programId,
      userId: input.userId ?? existing.userId ?? null,
      personId: input.personId ?? existing.personId ?? null,
      tier: input.tier ?? existing.tier ?? null,
      pointsBalance: input.pointsBalance ?? existing.pointsBalance,
    });
    if (input.pointsDelta && input.pointsDelta !== 0) {
      await this.adjustPoints(
        updated.id,
        input.pointsDelta,
        input.reason ?? "adjustment",
        { brandId: updated.brandId ?? undefined },
      );
    }
    return mapCustomer(updated);
  }

  async adjustPoints(
    customerId: string,
    delta: number,
    reason: string,
    context: LoyaltyActionContext = {},
  ) {
    const customer = await findUserLoyaltyById(customerId);
    if (!customer) throw notFound("Loyalty customer not found");
    await applyPointsDelta({
      customerId,
      delta,
      reason,
      brandId: customer.brandId ?? null,
      programId: customer.programId,
    });
    await this.resolveTierForCustomer(customerId, context);
  }

  async remove(id: string) {
    await deleteUserLoyalty(id);
    return { id };
  }

  async listPrograms(
    context: LoyaltyActionContext = {},
    pagination: { page?: number; pageSize?: number } = {},
  ) {
    const filters = context.brandId ? { brandId: context.brandId } : {};
    const { items, total, page, pageSize } = await listProgramRecords(filters, pagination);
    return {
      items: items.map(mapProgram),
      total,
      page,
      pageSize,
    };
  }

  async createProgram(
    input: CreateLoyaltyProgramInput,
    context: LoyaltyActionContext = {},
  ): Promise<LoyaltyProgramDTO> {
    if (context.brandId && input.brandId && context.brandId !== input.brandId) {
      throw forbidden("Cannot create a program for another brand");
    }
    const brandId = context.brandId ?? input.brandId ?? null;
    const created = await createProgram({
      brandId,
      name: input.name,
      description: input.description ?? null,
      status: input.status ?? "ACTIVE",
    });
    return mapProgram(created);
  }

  async listTiers(
    programId: string,
    context: LoyaltyActionContext = {},
    pagination: { page?: number; pageSize?: number } = {},
  ) {
    await this.ensureProgram(programId, context);
    const { items, total, page, pageSize } = await listProgramTiers(programId, pagination);
    return {
      items: items.map(mapTier),
      total,
      page,
      pageSize,
    };
  }

  async createTier(
    programId: string,
    input: CreateLoyaltyTierInput,
    context: LoyaltyActionContext = {},
  ): Promise<LoyaltyTierDTO> {
    const program = await this.ensureProgram(programId, context);
    if (input.maxPoints != null && input.maxPoints < input.minPoints) {
      throw badRequest("maxPoints must be greater than or equal to minPoints");
    }
    const created = await createProgramTier({
      programId,
      brandId: program.brandId ?? null,
      name: input.name,
      minPoints: input.minPoints,
      maxPoints: input.maxPoints ?? null,
      benefitsDescription: input.benefitsDescription ?? null,
    });
    return mapTier(created);
  }

  async listRewards(
    programId: string,
    context: LoyaltyActionContext = {},
    pagination: { page?: number; pageSize?: number } = {},
  ) {
    await this.ensureProgram(programId, context);
    const { items, total, page, pageSize } = await listProgramRewards(programId, pagination);
    return {
      items: items.map(mapReward),
      total,
      page,
      pageSize,
    };
  }

  async createReward(
    programId: string,
    input: CreateLoyaltyRewardInput,
    context: LoyaltyActionContext = {},
  ): Promise<LoyaltyRewardDTO> {
    const program = await this.ensureProgram(programId, context);
    const created = await createProgramReward({
      programId,
      brandId: program.brandId ?? null,
      name: input.name,
      description: input.description ?? null,
      costPoints: input.pointsCost,
      pointsCost: input.pointsCost,
      rewardType: input.rewardType ?? null,
      payloadJson: normalizePayload(input.payloadJson),
    });
    return mapReward(created);
  }

  async redeemReward(
    rewardId: string,
    input: RedeemRewardInput,
    context: LoyaltyActionContext = {},
  ): Promise<RedeemRewardResult> {
    const reward = await findProgramRewardById(rewardId);
    if (!reward) throw notFound("Reward not found");
    this.assertBrandAccess(reward.brandId, context.brandId);
    if (!reward.programId) {
      throw badRequest("Reward is not associated with a loyalty program");
    }
    const customer = await findUserLoyaltyById(input.customerId);
    if (!customer) throw notFound("Loyalty customer not found");
    this.assertBrandAccess(customer.brandId, context.brandId);
    if (customer.programId !== reward.programId) {
      throw badRequest("Customer does not belong to the reward's program");
    }
    const pointsCost = reward.pointsCost ?? reward.costPoints ?? 0;
    if (pointsCost > customer.pointsBalance) {
      throw badRequest("Customer does not have enough points");
    }
    const metadataJson = normalizePayload(input.metadata);
    const updated = await redeemRewardTransaction({
      customerId: customer.id,
      rewardId,
      programId: reward.programId,
      pointsCost,
      metadataJson,
      brandId: customer.brandId ?? null,
      reason: `reward:${reward.name}`,
    });
    await emitLoyaltyRewardRedeemed(
      {
        brandId: customer.brandId ?? undefined,
        customerId: customer.id,
        rewardId,
        pointsCost,
        metadata: input.metadata ?? null,
      },
      {
        brandId: customer.brandId ?? undefined,
        actorUserId: context.actorUserId,
        source: "loyalty",
      },
    );
    await this.resolveTierForCustomer(customer.id, context);
    return {
      customerId: customer.id,
      pointsBalance: updated.pointsBalance,
      tierId: updated.tierId ?? undefined,
    };
  }

  async resolveTierForCustomer(customerId: string, context: LoyaltyActionContext = {}) {
    const customer = await findCustomerWithProgramAndTiers(customerId);
    if (!customer) throw notFound("Loyalty customer not found");
    this.assertBrandAccess(customer.brandId, context.brandId);
    const tiers = customer.program?.tiers ?? [];
    const eligible = tiers
      .filter((tier) => {
        const hasMin = customer.pointsBalance >= tier.minPoints;
        const withinMax = tier.maxPoints == null || customer.pointsBalance <= tier.maxPoints;
        return hasMin && withinMax;
      })
      .sort((a, b) => b.minPoints - a.minPoints);
    const targetTier = eligible[0];
    const newTierId = targetTier?.id ?? null;
    const newTierName = targetTier?.name ?? null;
    if (newTierId === customer.tierId) {
      return;
    }
    await updateCustomerTier(customerId, newTierId, newTierName);
    await emitLoyaltyTierChanged(
      {
        brandId: customer.brandId ?? undefined,
        customerId,
        oldTierId: customer.tierId ?? undefined,
        newTierId: newTierId ?? undefined,
        tierName: newTierName ?? undefined,
      },
      {
        brandId: customer.brandId ?? undefined,
        actorUserId: context.actorUserId,
        source: "loyalty",
      },
    );
  }

  async createAIInsight(data: LoyaltyInsightCreateInput): Promise<LoyaltyInsightPayload> {
    return createLoyaltyInsight(data);
  }

  private async ensureProgram(programId: string, context: LoyaltyActionContext) {
    const program = await findProgramById(programId);
    if (!program) throw notFound("Loyalty program not found");
    this.assertBrandAccess(program.brandId, context.brandId);
    return program;
  }

  private assertBrandAccess(entityBrand?: string | null, contextBrand?: string) {
    if (contextBrand && entityBrand && contextBrand !== entityBrand) {
      throw forbidden("Access denied for this brand");
    }
  }
}

export const loyaltyService = new LoyaltyService();
