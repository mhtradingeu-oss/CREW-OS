import { emitAffiliateRewardIssued } from "./affiliate.events.js";
// No Prisma imports allowed in service layer

// --- Mappers ---
function decimalToNumber(value: any): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object" && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value);
}

function mapAffiliateTierToDTO(tier: any): AffiliateTierDTO | null {
  if (!tier) return null;
  return {
    id: tier.id,
    brandId: tier.brandId ?? undefined,
    name: tier.name,
    rules: tier.rulesJson ?? undefined,
  };
}

function mapAffiliateToDTO(record: any): AffiliateDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    tierId: record.tierId ?? undefined,
    code: record.code ?? undefined,
    type: record.type ?? undefined,
    channel: record.channel ?? undefined,
    status: record.status ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    tier: record.tier ? mapAffiliateTierToDTO(record.tier) : undefined,
  };
}

function mapAffiliateLinkToDTO(record: any): AffiliateLinkDTO {
  return {
    id: record.id,
    affiliateId: record.affiliateId,
    linkCode: record.linkCode,
    targetUrl: record.targetUrl ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapAffiliateConversionToDTO(record: any): AffiliateConversionDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    affiliateId: record.affiliateId,
    orderId: record.orderId ?? undefined,
    amount: decimalToNumber(record.amount),
    currency: record.currency ?? undefined,
    metadata: record.metadata ? JSON.parse(record.metadata) : undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapAffiliatePayoutToDTO(record: any): AffiliatePayoutDTO {
  return {
    id: record.id,
    affiliateId: record.affiliateId,
    brandId: record.brandId ?? undefined,
    amount: decimalToNumber(record.amount),
    currency: record.currency ?? undefined,
    status: record.status ?? undefined,
    method: record.method ?? undefined,
    notes: record.notes ?? undefined,
    requestedAt: record.requestedAt,
    resolvedAt: record.resolvedAt ?? undefined,
    paidAt: record.paidAt ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
/**
 * AFFILIATE SERVICE — MH-OS v2
 * Spec: docs/os/12_affiliate-program.md (MASTER_INDEX)
 */
import { affiliateRepository } from "../../core/db/repositories/affiliate.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, forbidden, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import {
  emitAffiliateConversionCreated,
  emitAffiliatePayoutApproved,
  emitAffiliatePayoutPaid,
  emitAffiliatePayoutRejected,
  emitAffiliatePayoutRequested,
} from "./affiliate.events.js";
import type {
  AffiliateConversionCreateInput,
  AffiliateConversionDTO,
  AffiliateConversionEventPayload,
  AffiliateDTO,
  AffiliateTierDTO,
  AffiliateLinkCreateInput,
  AffiliateLinkDTO,
  AffiliateListParams,
  AffiliateListResponse,
  AffiliateCreateInput,
  AffiliatePayoutDTO,
  AffiliatePayoutRequestInput,
  AffiliatePayoutStatus,
  AffiliatePayoutStatusEventPayload,
  AffiliateStatsDTO,
  AffiliateUpdateInput,
  AffiliateDashboardSummary,
  AffiliateActionContext,
} from "./affiliate.types.js";
import * as cuid from "@paralleldrive/cuid2";

// Selects/types are now in repository

// Mapping helpers removed; handled in controller/service if needed

// Payout status change logic moved to service below

export const affiliateService = {
    /**
     * Track an affiliate action (conversion, click, etc.)
     * Ensures no double rewards for the same order/action.
     */
    async trackAffiliateAction(
      input: { affiliateId: string; orderId: string; amount: number; currency: string; metadata?: Record<string, unknown> },
      context: AffiliateActionContext,
    ): Promise<AffiliateConversionDTO> {
      // Check for existing conversion for this orderId and affiliateId
      const existing = await affiliateRepository.findConversionByAffiliateAndOrder(input.affiliateId, input.orderId);
      if (existing) throw badRequest("Reward already issued for this order/action");
      // Create conversion
      const conversion = await affiliateRepository.createConversion({
        affiliateId: input.affiliateId,
        brandId: context.brandId ?? null,
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      // Calculate and issue reward
      await this.issueAffiliateReward(conversion, context);
      return mapAffiliateConversionToDTO(conversion);
    },

    /**
     * Calculate the affiliate reward for a conversion.
     * (Stub: replace with real business logic as needed)
     */
    async calculateAffiliateReward(conversion: any): Promise<number> {
      // Example: 10% commission
      if (!conversion.amount) return 0;
      return Math.round(conversion.amount * 0.1 * 100) / 100;
    },

    /**
     * Issue a reward for an affiliate conversion, emit event, and ensure no double rewards.
     */
    async issueAffiliateReward(conversion: any, context: AffiliateActionContext): Promise<void> {
      // Check for existing payout for this conversion/orderId
      const payouts = await affiliateRepository.findPayoutsByAffiliateAndOrder(conversion.affiliateId, conversion.brandId);
      if (payouts && payouts.length > 0) throw badRequest("Reward already issued for this order/action");
      // Calculate reward
      const reward = await this.calculateAffiliateReward(conversion);
      if (reward <= 0) return;
      // Create payout (status: PAID)
      const payout = await affiliateRepository.requestPayout({
        affiliateId: conversion.affiliateId,
        brandId: conversion.brandId ?? null,
        amount: reward,
        currency: conversion.currency ?? null,
        status: "PAID",
        requestedAt: new Date(),
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        notes: `Auto-issued for order ${conversion.orderId}`,
        method: "auto",
      });
      // Emit event
      await emitAffiliateRewardIssued({
        brandId: conversion.brandId ?? undefined,
        affiliateId: conversion.affiliateId,
        action: "reward.issued",
        metadata: { orderId: conversion.orderId, payoutId: payout.id, amount: reward },
      }, {
        brandId: conversion.brandId ?? undefined,
        actorUserId: context.actorUserId,
        source: "api",
      });
    },
  async getDashboardSummary(brandId: string): Promise<AffiliateDashboardSummary> {
    const [totalAffiliates, activeAffiliates, conversionAgg, commissionAgg, pendingPayoutAgg] =
      await affiliateRepository.getDashboardSummary(brandId);
    return {
      totalAffiliates,
      activeAffiliates,
      totalConversions: conversionAgg._count.id ?? 0,
      totalRevenue: Number(conversionAgg._sum.amount ?? 0),
      totalCommission: Number(commissionAgg._sum?.commission ?? 0),
      pendingPayouts: Number(pendingPayoutAgg._sum.amount ?? 0),
    };
  },

  async listAffiliates(params: AffiliateListParams): Promise<AffiliateListResponse> {
    const { brandId, search, status, tierId, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: any = { brandId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { type: { contains: search, mode: "insensitive" } },
        { channel: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status) where.status = status;
    if (tierId) where.tierId = tierId;
    const [total, rows] = await affiliateRepository.listAffiliates(where, skip, take);
    const ids = rows.map((row: any) => row.id);
    // Aggregate stats
    const [perfRows, salesRows, payoutRows] = await Promise.all([
      affiliateRepository.aggregatePerformance(ids),
      affiliateRepository.aggregateSales(ids),
      affiliateRepository.aggregatePayouts(ids),
    ]);
    // Map stats
    const perfMap = new Map(ids.map((id: string) => [id, { clicks: 0, orders: 0, revenue: 0 }]));
    for (const row of perfRows) {
      perfMap.set(row.affiliateId, {
        clicks: row._sum.clicks ?? 0,
        orders: row._sum.orders ?? 0,
        revenue: Number(row._sum.revenue ?? 0),
      });
    }
    const salesMap = new Map(ids.map((id: string) => [id, { commission: 0 }]));
    for (const row of salesRows) {
      salesMap.set(row.affiliateId, { commission: Number(row._sum.commission ?? 0) });
    }
    const payoutMap = new Map(ids.map((id: string) => [id, { paid: 0, pending: 0 }]));
    for (const row of payoutRows) {
      const current = payoutMap.get(row.affiliateId) ?? { paid: 0, pending: 0 };
      const sum = Number(row._sum.amount ?? 0);
      if (row.status === "PAID") current.paid += sum;
      else if (row.status === "PENDING") current.pending += sum;
      payoutMap.set(row.affiliateId, current);
    }
    function enrichStats(affiliateId: string) {
      const perf = perfMap.get(affiliateId);
      const sales = salesMap.get(affiliateId);
      const payouts = payoutMap.get(affiliateId);
      return {
        totalClicks: perf?.clicks ?? 0,
        totalOrders: perf?.orders ?? 0,
        totalRevenue: perf?.revenue ?? 0,
        totalCommission: sales?.commission ?? 0,
        paidPayouts: payouts?.paid ?? 0,
        pendingPayouts: payouts?.pending ?? 0,
      };
    }
    return {
      total,
      page,
      pageSize: take,
      items: rows.map((row: any) => ({
        ...row,
        stats: enrichStats(row.id),
      })),
    };
  },

  async getAffiliateById(affiliateId: string, brandId: string): Promise<AffiliateDTO | null> {
    const record = await affiliateRepository.getAffiliateById(affiliateId, brandId);
    if (!record) return null;
    const [perfRows, salesRows, payoutRows] = await Promise.all([
      affiliateRepository.aggregatePerformance([affiliateId]),
      affiliateRepository.aggregateSales([affiliateId]),
      affiliateRepository.aggregatePayouts([affiliateId]),
    ]);
    const perfSum = perfRows[0]?._sum ?? { clicks: 0, orders: 0, revenue: null };
    const salesSum = salesRows[0]?._sum ?? { commission: null };
    const payoutAgg = { paid: 0, pending: 0 };
    for (const row of payoutRows) {
      const sum = decimalToNumber(row._sum.amount) ?? 0;
      if (row.status === "PAID") payoutAgg.paid += sum;
      else if (row.status === "PENDING") payoutAgg.pending += sum;
    }
    return {
      ...mapAffiliateToDTO(record),
      stats: {
        totalClicks: perfSum.clicks ?? 0,
        totalOrders: perfSum.orders ?? 0,
        totalRevenue: decimalToNumber(perfSum.revenue) ?? 0,
        totalCommission: decimalToNumber(salesSum.commission) ?? 0,
        paidPayouts: payoutAgg.paid,
        pendingPayouts: payoutAgg.pending,
      },
    };
  },

  async createAffiliate(input: AffiliateCreateInput): Promise<AffiliateDTO> {
    const code = input.code ?? cuid.createId();
    // Check for duplicate code
    const existing = await affiliateRepository.getAffiliateById(code, input.brandId);
    if (existing) throw badRequest("Affiliate code already in use");
    const created = await affiliateRepository.createAffiliate({
      brandId: input.brandId,
      tierId: input.tierId ?? null,
      code,
      type: input.type ?? null,
      channel: input.channel ?? null,
      status: input.status ?? "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    logger.info(`[affiliate] Created affiliate ${created.id} for brand ${input.brandId}`);
    // Fix brandId type for DTO
    return mapAffiliateToDTO(created);
  },

  async updateAffiliate(
    affiliateId: string,
    brandId: string,
    input: AffiliateUpdateInput,
  ): Promise<AffiliateDTO> {
    const existing = await affiliateRepository.getAffiliateById(affiliateId, brandId);
    if (!existing) throw notFound("Affiliate not found");
    const updated = await affiliateRepository.updateAffiliate(affiliateId, {
      tierId: input.tierId ?? existing.tierId,
      code: input.code ?? existing.code,
      type: input.type ?? existing.type,
      channel: input.channel ?? existing.channel,
      status: input.status ?? existing.status,
      updatedAt: new Date(),
    } as any);
    // Fix brandId type for DTO
    return mapAffiliateToDTO(updated);
  },

  async deactivateAffiliate(affiliateId: string, brandId: string): Promise<AffiliateDTO> {
    const existing = await affiliateRepository.getAffiliateById(affiliateId, brandId);
    if (!existing) throw notFound("Affiliate not found");
    const updated = await affiliateRepository.deactivateAffiliate(affiliateId);
    // Fix brandId type for DTO
    return mapAffiliateToDTO(updated);
  },

  async getAffiliateStats(affiliateId: string, brandId: string): Promise<AffiliateStatsDTO> {
    const [perfRows, salesRows, payoutRows] = await Promise.all([
      affiliateRepository.aggregatePerformance([affiliateId]),
      affiliateRepository.aggregateSales([affiliateId]),
      affiliateRepository.aggregatePayouts([affiliateId]),
    ]);
    const perfSum = perfRows[0]?._sum ?? { clicks: 0, orders: 0, revenue: null };
    const salesSum = salesRows[0]?._sum ?? { commission: null };
    const payoutAgg = { paid: 0, pending: 0 };
    for (const row of payoutRows) {
      const sum = decimalToNumber(row._sum.amount) ?? 0;
      if (row.status === "PAID") payoutAgg.paid += sum;
      else if (row.status === "PENDING") payoutAgg.pending += sum;
    }
    return {
      totalClicks: perfSum.clicks ?? 0,
      totalOrders: perfSum.orders ?? 0,
      totalRevenue: decimalToNumber(perfSum.revenue) ?? 0,
      totalCommission: decimalToNumber(salesSum.commission) ?? 0,
      paidPayouts: payoutAgg.paid,
      pendingPayouts: payoutAgg.pending,
    };
  },

  async listLinks(affiliateId: string, brandId: string): Promise<AffiliateLinkDTO[]> {
    await this.getAffiliateById(affiliateId, brandId); // ensure exists
      const links = await affiliateRepository.listLinks(affiliateId);
      // Fix affiliateId type for DTO
      return links.map(mapAffiliateLinkToDTO);
  },

  async createLink(input: AffiliateLinkCreateInput): Promise<AffiliateLinkDTO> {
    // Validate affiliate exists
    const affiliate = await affiliateRepository.getAffiliateById(input.affiliateId, undefined as any);
    if (!affiliate) throw notFound("Affiliate not found");
    const linkCode = cuid.createId();
    const created = await affiliateRepository.createLink({
      affiliateId: input.affiliateId,
      linkCode,
      targetUrl: input.targetUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    logger.info(`[affiliate] Created link ${linkCode} for affiliate ${input.affiliateId}`);
    // Fix affiliateId type for DTO
      return mapAffiliateLinkToDTO(created);
  },

  async createConversion(
    input: AffiliateConversionCreateInput,
    context: AffiliateActionContext,
  ): Promise<AffiliateConversionDTO> {
    // Validate affiliate
    const affiliate = await affiliateRepository.getAffiliateById(input.affiliateId, context.brandId!);
    if (!affiliate) throw notFound("Affiliate not found");
    // Atomic create
    const conversion = await affiliateRepository.createConversion({
      affiliateId: affiliate.id,
      brandId: affiliate.brandId ?? null,
      orderId: input.orderId ?? null,
      amount: input.amount ?? null,
      currency: input.currency ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const payload: AffiliateConversionEventPayload = {
      brandId: affiliate.brandId ?? undefined,
      affiliateId: affiliate.id,
      orderId: conversion.orderId ?? undefined,
      amount: conversion.amount != null ? Number(conversion.amount) : undefined,
      currency: conversion.currency ?? undefined,
      metadata: input.metadata ?? null,
    };
    await emitAffiliateConversionCreated(payload, {
      brandId: affiliate.brandId ?? undefined,
      actorUserId: context.actorUserId,
      source: "api",
    });
    return mapAffiliateConversionToDTO(conversion);
  },

  async requestPayout(
    input: AffiliatePayoutRequestInput,
    context: AffiliateActionContext,
  ): Promise<AffiliatePayoutDTO> {
    // Validate affiliate
    const affiliate = await affiliateRepository.getAffiliateById(input.affiliateId, context.brandId!);
    if (!affiliate) throw notFound("Affiliate not found");
    // Atomic create
    const created = await affiliateRepository.requestPayout({
      affiliateId: affiliate.id,
      brandId: affiliate.brandId ?? null,
      amount: input.amount,
      currency: input.currency ?? null,
      status: "PENDING",
      requestedAt: new Date(),
      method: input.method ?? null,
      notes: input.notes ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    const payload: AffiliatePayoutStatusEventPayload = {
      brandId: affiliate.brandId ?? undefined,
      affiliateId: affiliate.id,
      payoutId: created.id,
      amount: created.amount != null ? Number(created.amount) : undefined,
      status: "PENDING",
      metadata: input.notes ? { notes: input.notes } : null,
    };
    await emitAffiliatePayoutRequested(payload, {
      brandId: affiliate.brandId ?? undefined,
      actorUserId: context.actorUserId,
      source: "api",
    });
    return mapAffiliatePayoutToDTO(created);
  },

  async approvePayout(payoutId: string, context: AffiliateActionContext): Promise<AffiliatePayoutDTO> {
    return this._changePayoutStatus(payoutId, "APPROVED", context);
  },

  async rejectPayout(
    payoutId: string,
    context: AffiliateActionContext,
    notes?: string,
  ): Promise<AffiliatePayoutDTO> {
    return this._changePayoutStatus(payoutId, "REJECTED", context, notes);
  },

  async markPayoutPaid(payoutId: string, context: AffiliateActionContext): Promise<AffiliatePayoutDTO> {
    return this._changePayoutStatus(payoutId, "PAID", context);
  },

  async _changePayoutStatus(
    payoutId: string,
    status: AffiliatePayoutStatus,
    context: AffiliateActionContext,
    notes?: string,
  ): Promise<AffiliatePayoutDTO> {
    // Fetch payout and affiliate for brand check
    const payout = await affiliateRepository.changePayoutStatus(payoutId, {}); // Fetch only
    if (!payout) throw notFound("Payout not found");
    // TODO: Add brand access check if needed
    const updates: any = {
      status,
      resolvedAt: new Date(),
      notes: notes ?? undefined,
    };
    if (status === "PAID") updates.paidAt = new Date();
    const updated = await affiliateRepository.changePayoutStatus(payoutId, updates);
    const payload: AffiliatePayoutStatusEventPayload = {
      brandId: updated.brandId ?? undefined,
      affiliateId: updated.affiliateId,
      payoutId: updated.id,
      amount: updated.amount != null ? Number(updated.amount) : undefined,
      status,
      metadata: notes ? { notes } : null,
    };
    const eventContext = {
      brandId: updated.brandId ?? undefined,
      actorUserId: context.actorUserId,
      source: "api",
    };
    if (status === "APPROVED") {
      await emitAffiliatePayoutApproved(payload, eventContext);
    } else if (status === "REJECTED") {
      await emitAffiliatePayoutRejected(payload, eventContext);
    } else if (status === "PAID") {
      await emitAffiliatePayoutPaid(payload, eventContext);
    }
    return mapAffiliatePayoutToDTO(updated);
  },
};
