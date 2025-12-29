import { partnersRepository } from "../../core/db/repositories/partners.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import type {
  PartnerContractRecord,
  PartnerPricingRecord,
  PartnerRecord,
  PartnerUserRecord as PartnerUserDbRecord,
} from "../../core/db/repositories/partners.repository.js";
import type {
  CreatePartnerInput,
  CreatePartnerUserInput,
  PartnerContractCreateInput,
  PartnerContractDTO,
  PartnerContractListParams,
  PartnerContractListResponse,
  PartnerContractTerms,
  PartnerContractUpdateInput,
  PartnerDTO,
  PartnerDetailDTO,
  PartnerListParams,
  PartnerPricingDTO,
  PartnerPricingListParams,
  PartnerPricingListResponse,
  PartnerPricingMetadata,
  PartnerPricingUpsertInput,
  PartnerStatsDTO,
  PartnerUserRecord,
  PaginatedPartners,
  PaginatedPartnerUsers,
  PartnerUserListParams,
  PartnerUserRole,
  UpdatePartnerInput,
  UpdatePartnerUserInput,
} from "./partners.types.js";
import {
  emitPartnersCreated,
  emitPartnersDeleted,
  emitPartnersPricingUpdated,
  emitPartnersUpdated,
} from "./partners.events.js";

type PartnerWhereInput = Parameters<typeof partnersRepository.listPartners>[0];
type PartnerContractWhereInput = Parameters<typeof partnersRepository.listPartnerContracts>[0];
type PartnerPricingWhereInput = Parameters<typeof partnersRepository.listPartnerPricing>[0];
type PartnerUserWhereInput = Parameters<typeof partnersRepository.listPartnerUsers>[0];

class PartnerService {

  async list(params: PartnerListParams): Promise<PaginatedPartners> {
    const { brandId, search, tierId, status, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: PartnerWhereInput = { brandId };
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (tierId) where.tierId = tierId;
    if (status) where.status = status;

    const [total, rows] = await partnersRepository.listPartners(where, skip, take);

    return {
      data: rows.map((row) => this.mapPartner(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async listPartnerContracts(params: PartnerContractListParams): Promise<PartnerContractListResponse> {
    await this.ensurePartner(params.partnerId, params.brandId);
    const { partnerId, page = 1, pageSize = 20, onlyActive } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: PartnerContractWhereInput = { partnerId };
    if (onlyActive) {
      const now = new Date();
      where.OR = [{ endDate: null }, { endDate: { gte: now } }];
    }

    const [total, rows] = await partnersRepository.listPartnerContracts(where, skip, take);

    return {
      data: rows.map((row) => this.mapPartnerContract(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async getPartnerContract(contractId: string, partnerId: string, brandId: string): Promise<PartnerContractDTO> {
    await this.ensurePartner(partnerId, brandId);
    const contract = await partnersRepository.getPartnerContract(contractId, partnerId);
    if (!contract) throw notFound("Contract not found");
    return this.mapPartnerContract(contract);
  }

  async createPartnerContract(input: PartnerContractCreateInput): Promise<PartnerContractDTO> {
    await this.ensurePartner(input.partnerId, input.brandId);
    const serializedTerms = this.serializeTerms(input.terms);
    const created = await partnersRepository.createOrUpdatePartnerContractAtomic({
      contractId: null,
      createData: {
        partner: { connect: { id: input.partnerId } },
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
        termsJson: serializedTerms,
      },
    });
    logger.info(`[partners] Created contract ${created.id} for partner ${input.partnerId}`);
    return this.mapPartnerContract(created);
  }

  async updatePartnerContract(
    contractId: string,
    partnerId: string,
    brandId: string,
    input: PartnerContractUpdateInput,
  ): Promise<PartnerContractDTO> {
    await this.ensurePartner(partnerId, brandId);
    const contract = await partnersRepository.getPartnerContract(contractId, partnerId);
    if (!contract) throw notFound("Contract not found");

    const serializedTerms = this.serializeTerms(input.terms);
    const updated = await partnersRepository.createOrUpdatePartnerContractAtomic({
      contractId,
      updateData: {
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        termsJson: serializedTerms ?? undefined,
      },
    });

    logger.info(`[partners] Updated contract ${updated.id} for partner ${partnerId}`);
    return this.mapPartnerContract(updated);
  }

  async removePartnerContract(contractId: string, partnerId: string, brandId: string) {
    await this.ensurePartner(partnerId, brandId);
    const contract = await partnersRepository.getPartnerContract(contractId, partnerId);
    if (!contract) throw notFound("Contract not found");

    await partnersRepository.deletePartnerContract(contractId);
    logger.info(`[partners] Removed contract ${contractId} for partner ${partnerId}`);
    return { id: contractId };
  }

  async listPartnerPricing(params: PartnerPricingListParams): Promise<PartnerPricingListResponse> {
    await this.ensurePartner(params.partnerId, params.brandId);
    const { partnerId, productId, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: PartnerPricingWhereInput = { partnerId };
    if (productId) where.productId = productId;

    const [total, rows] = await partnersRepository.listPartnerPricing(where, skip, take);

    return {
      data: rows.map((row) => this.mapPartnerPricing(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async upsertPartnerPricing(input: PartnerPricingUpsertInput): Promise<PartnerPricingDTO> {
    await this.ensurePartner(input.partnerId, input.brandId);
    const product = await partnersRepository.getProductForBrand(input.productId, input.brandId);
    if (!product) throw notFound("Product not found for this brand");

    const currency = input.currency ?? (await this.getBrandCurrency(input.brandId)) ?? null;

    const result = await partnersRepository.upsertPartnerPricingAtomic({
      partnerId: input.partnerId,
      productId: input.productId,
      netPrice: input.netPrice,
      currency,
    });

    logger.info(
      `[partners] Upserted pricing (${result.id}) for partner ${input.partnerId} / product ${input.productId}`,
    );
    const pricingMetadata = this.buildPricingMetadataPayload(input, currency);
    await emitPartnersPricingUpdated({
      partnerId: input.partnerId,
      brandId: input.brandId,
      entityId: result.id,
      metadata: pricingMetadata,
    });
    return this.mapPartnerPricing(result);
  }

  async getById(id: string, brandId: string): Promise<PartnerDetailDTO> {
    const partner = await partnersRepository.getPartnerById(id, brandId);
    if (!partner) {
      throw notFound("Partner not found");
    }

    const [contractCount, latestContract, pricingCount, orderAggregate] =
      await partnersRepository.getPartnerOverview(id, brandId);

    const totalOrders =
      typeof orderAggregate._count === "object" && orderAggregate._count
        ? orderAggregate._count._all ?? 0
        : 0;
    return {
      ...this.mapPartner(partner),
      contractsCount: contractCount,
      latestContract: latestContract
        ? { startDate: latestContract.startDate ?? undefined, endDate: latestContract.endDate ?? undefined }
        : undefined,
      pricingCount,
      totalOrders,
      totalRevenue: this.toNumber(orderAggregate._sum?.total),
    };
  }

  async create(input: CreatePartnerInput): Promise<PartnerDTO> {
    await this.ensureBrandExists(input.brandId);
    if (input.tierId) await this.ensureTierBelongs(input.tierId, input.brandId);
    await this.ensureNameUnique(input.brandId, input.name);

    const normalizedCountry = this.normalizeLocation(input.country);
    const normalizedCity = this.normalizeLocation(input.city);

    const created = await partnersRepository.createPartner({
      brand: { connect: { id: input.brandId } },
      type: input.type,
      name: input.name,
      country: normalizedCountry,
      city: normalizedCity,
      tier: input.tierId ? { connect: { id: input.tierId } } : undefined,
      status: input.status ?? "ACTIVE",
    });

    logger.info(`[partners] Created ${created.name} (${created.id}) for brand ${created.brandId}`);
    await emitPartnersCreated({ id: created.id });
    return this.mapPartner(created);
  }

  async update(id: string, brandId: string, input: UpdatePartnerInput): Promise<PartnerDTO> {
    const existing = await partnersRepository.getPartnerById(id, brandId);
    if (!existing) throw notFound("Partner not found");

    if (input.tierId && input.tierId !== existing.tierId) {
      await this.ensureTierBelongs(input.tierId, brandId);
    }

    if (input.name && input.name !== existing.name) {
      await this.ensureNameUnique(brandId, input.name, id);
    }

    const normalizedCountry = this.normalizeLocation(input.country ?? existing.country);
    const normalizedCity = this.normalizeLocation(input.city ?? existing.city);

    const updated = await partnersRepository.updatePartner(id, {
      type: input.type ?? existing.type,
      name: input.name ?? existing.name,
      country: normalizedCountry,
      city: normalizedCity,
      tier: input.tierId ? { connect: { id: input.tierId } } : undefined,
      status: input.status ?? existing.status,
    });

    logger.info(`[partners] Updated ${updated.name} (${updated.id})`);
    await emitPartnersUpdated({ id: updated.id });
    return this.mapPartner(updated);
  }

  async deactivate(id: string, brandId: string) {
    const existing = await partnersRepository.getPartnerById(id, brandId);
    if (!existing) throw notFound("Partner not found");

    await partnersRepository.deactivatePartner(id);

    logger.info(`[partners] Deactivated ${existing.name} (${existing.id})`);
    await emitPartnersDeleted({ id: existing.id });
    return { id: existing.id };
  }

  async getStats(partnerId: string, brandId: string): Promise<PartnerStatsDTO> {
    const partner = await partnersRepository.getPartnerById(partnerId, brandId);
    if (!partner) throw notFound("Partner not found");

    const [orderGroups, orderItemsAgg, standCount, whiteLabelRevenueAgg, lastOrder] =
      await partnersRepository.getPartnerStatsAggregates(partnerId, brandId);

    const affiliateLinkCount = partner.brandId
      ? await partnersRepository.countAffiliateLinksByBrand(partner.brandId)
      : 0;

    const affiliateRevenueAgg = partner.brandId
      ? await partnersRepository.aggregateAffiliatePerformanceByBrand(partner.brandId)
      : { _sum: { revenue: null } };

    const orderMetrics = orderGroups[0];
    const countMetrics = orderMetrics?._count;
    const sumMetrics = orderMetrics?._sum;
    const totalOrders =
      typeof countMetrics === "object" && countMetrics !== null
        ? countMetrics._all ?? 0
        : 0;
    const totalRevenue =
      typeof sumMetrics === "object" && sumMetrics !== null
        ? this.toNumber(sumMetrics.total)
        : 0;
    const totalProducts = orderItemsAgg._sum?.quantity ?? 0;
    const whiteLabelRevenue = this.toNumber(whiteLabelRevenueAgg._sum?.total);
    const affiliateRevenue = this.toNumber(affiliateRevenueAgg._sum?.revenue);

    return {
      totalOrders,
      totalRevenue,
      totalProducts,
      totalStands: standCount,
      affiliateLinks: affiliateLinkCount,
      affiliateRevenue,
      whiteLabelRevenue,
      lastOrderAt: lastOrder?.createdAt ?? undefined,
    };
  }

  async listPartnerUsers(params: PartnerUserListParams): Promise<PaginatedPartnerUsers> {
    const { partnerId, brandId, page = 1, pageSize = 20 } = params;
    await this.ensurePartner(partnerId, brandId);

    const { skip, take } = buildPagination({ page, pageSize });
    const where: PartnerUserWhereInput = { partnerId };

    const [total, rows] = await partnersRepository.listPartnerUsers(where, skip, take);

    return {
      data: rows.map((row) => this.mapPartnerUser(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async createPartnerUser(
    partnerId: string,
    brandId: string,
    input: CreatePartnerUserInput,
  ): Promise<PartnerUserRecord> {
    await this.ensurePartner(partnerId, brandId);
    const role = input.role ?? ("PARTNER_USER" as PartnerUserRole);
    const userId = input.userId;

    // Validation: must have userId or (email+password)
    if (!userId && (!input.email || !input.password)) {
      throw badRequest("email and password are required when creating a new user");
    }
    if (userId) {
      const existingUser = await partnersRepository.getUserById(userId);
      if (!existingUser) throw notFound("User not found");
    }
    // Check for existing link
    const alreadyLinked = userId
      ? await partnersRepository.getPartnerUserByPartnerAndUser(partnerId, userId)
      : null;
    if (alreadyLinked) {
      throw badRequest("User already assigned to this partner");
    }

    // Atomic: create user if needed, then link
    const created = await partnersRepository.attachUserToPartnerAtomic({
      userData: !userId ? { email: input.email!, password: input.password!, role } : undefined,
      userId,
      partnerId,
      role,
    });

    logger.info(`[partners] Linked user ${created.userId} to partner ${partnerId}`);
    return this.mapPartnerUser(created);
  }

  async updatePartnerUser(
    partnerId: string,
    brandId: string,
    partnerUserId: string,
    input: UpdatePartnerUserInput,
  ): Promise<PartnerUserRecord> {
    await this.ensurePartner(partnerId, brandId);
    const existing = await partnersRepository.getPartnerUser(partnerUserId, partnerId);
    if (!existing) throw notFound("Partner user not found");

    const updated = await partnersRepository.updatePartnerUser(partnerUserId, {
      role: input.role ?? existing.role,
    });

    logger.info(`[partners] Updated partner user ${partnerUserId} (${updated.role})`);
    return this.mapPartnerUser(updated);
  }

  async deactivatePartnerUser(
    partnerId: string,
    brandId: string,
    partnerUserId: string,
  ) {
    await this.ensurePartner(partnerId, brandId);
    const existing = await partnersRepository.getPartnerUser(partnerUserId, partnerId);
    if (!existing) throw notFound("Partner user not found");

    await partnersRepository.deletePartnerUser(partnerUserId);
    logger.info(`[partners] Removed partner user ${partnerUserId} from ${partnerId}`);
    return { id: partnerUserId };
  }

  private mapPartner(row: PartnerRecord): PartnerDTO {
    return {
      id: row.id,
      brandId: this.mapNullable(row.brandId),
      type: row.type,
      name: row.name,
      country: this.mapNullable(row.country),
      city: this.mapNullable(row.city),
      status: this.mapNullable(row.status),
      tierId: this.mapNullable(row.tierId),
      tierName: this.mapNullable(row.tier?.name),
      createdAt: this.mapDateField(row.createdAt)!,
      updatedAt: this.mapDateField(row.updatedAt)!,
    };
  }

  private mapPartnerUser(row: PartnerUserDbRecord): PartnerUserRecord {
    return {
      id: row.id,
      partnerId: row.partnerId,
      userId: this.mapNullable(row.userId),
      role: this.mapNullable(row.role) as PartnerUserRole | undefined,
      userEmail: this.mapNullable(row.user?.email),
      createdAt: this.mapDateField(row.createdAt)!,
      updatedAt: this.mapDateField(row.updatedAt)!,
    };
  }

  private normalizeLocation(value?: string | null) {
    if (!value) return null;
    const cleaned = value.trim().replace(/\s+/g, " ");
    return cleaned || null;
  }

  private toNumber(value?: { toString: () => string } | number | null) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return value;
    if (typeof value === "object" && value !== null && "toString" in value) {
      return Number(value.toString());
    }
    return Number(value);
  }

  private async ensureBrandExists(brandId: string) {
    const exists = await partnersRepository.getBrandById(brandId);
    if (!exists) throw badRequest("Brand not found");
  }

  private async getBrandCurrency(brandId: string) {
    const brand = await partnersRepository.getBrandCurrency(brandId);
    return brand?.defaultCurrency ?? null;
  }

  private mapPartnerContract(row: PartnerContractRecord): PartnerContractDTO {
    return {
      id: row.id,
      partnerId: row.partnerId,
      startDate: this.mapDateField(row.startDate),
      endDate: this.mapDateField(row.endDate),
      brandId: this.mapNullable(row.partner?.brandId),
      terms: this.mapContractTerms(row.termsJson),
      createdAt: this.mapDateField(row.createdAt)!,
      updatedAt: this.mapDateField(row.updatedAt)!,
    };
  }

  private mapPartnerPricing(row: PartnerPricingRecord): PartnerPricingDTO {
    return {
      id: row.id,
      partnerId: row.partnerId,
      productId: row.productId,
      productName: this.mapNullable(row.product?.name),
      netPrice: this.mapDecimalValue(row.netPrice),
      currency: this.mapNullable(row.currency),
      createdAt: this.mapDateField(row.createdAt)!,
      updatedAt: this.mapDateField(row.updatedAt)!,
    };
  }

  private mapNullable<T>(value: T | null | undefined): T | undefined {
    return value === null ? undefined : value;
  }

  private mapDateField(value: Date | null | undefined): Date | undefined {
    return value ?? undefined;
  }

  private mapDecimalValue(value: unknown): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    if (typeof value === "object" && value !== null && "toString" in value) {
      const parsed = Number((value as { toString: () => string }).toString());
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private parseJsonField<T extends Record<string, unknown>>(
    value?: string | null,
    fallback: T = {} as T,
  ): T | undefined {
    if (value === null || value === undefined) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed === "object" && parsed !== null) {
        return parsed as T;
      }
    } catch {
      // fall through to fallback
    }
    return fallback;
  }

  private stringifyJsonField(value?: Record<string, unknown> | string | null): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    try {
      return JSON.stringify(value);
    } catch {
      return null;
    }
  }

  private mapContractTerms(value?: string | null): PartnerContractTerms | undefined {
    return this.parseJsonField<PartnerContractTerms>(value);
  }

  private serializeTerms(value?: PartnerContractTerms | string | null): string | null {
    return this.stringifyJsonField(value);
  }

  private buildPricingMetadataPayload(input: PartnerPricingUpsertInput, currency: string | null): PartnerPricingMetadata {
    return {
      ...(input.metadata ?? {}),
      action: "pricing-upsert",
      partnerId: input.partnerId,
      brandId: input.brandId,
      productId: input.productId,
      netPrice: input.netPrice,
      currency,
    };
  }

  private async ensureTierBelongs(tierId: string, brandId: string) {
    const tier = await partnersRepository.getTierForBrand(tierId, brandId);
    if (!tier) throw badRequest("Tier not found for this brand");
  }

  private async ensureNameUnique(brandId: string, name: string, excludeId?: string) {
    const existing = await partnersRepository.findPartnerByName(brandId, name, excludeId);
    if (existing) throw badRequest("Partner name already in use for this brand");
  }

  private async ensurePartner(partnerId: string, brandId: string) {
    const partner = await partnersRepository.getPartnerMinimal(partnerId, brandId);
    if (!partner) throw notFound("Partner not found");
    return partner;
  }
}

export const partnersService = new PartnerService();
