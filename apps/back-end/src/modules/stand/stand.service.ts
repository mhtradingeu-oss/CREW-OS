/**
 * STAND SERVICE — MH-OS v2
 * Spec: docs/os/09_stand-program.md (MASTER_INDEX)
 */

import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";

import type {
  StandPartnerCreateInput,
  StandPartnerDTO,
  StandPartnerListParams,
  StandPartnerListResponse,
  StandPartnerStatsDTO,
  StandPartnerUpdateInput,
  StandDashboardSummary,
} from "./stand.types.js";
import { standRepository, StandPartnerRecord } from "../../core/db/repositories/stand.repository.js";

const {
  aggregateStandStats,
  createStandPartner: createStandPartnerRecord,
  deactivateStandPartner: deactivateStandPartnerRecord,
  findBrandPartnerByIds,
  getDashboardSummary: getDashboardSummaryRecord,
  getStandPartnerById: getStandPartnerRecord,
  listStandPartners: listStandPartnerRecords,
  updateStandPartner: updateStandPartnerRecord,
} = standRepository;

type StandPartnerWhereInput = Parameters<typeof listStandPartnerRecords>[0];

function mapStandPartner(record: StandPartnerRecord): StandPartnerDTO {
  const brandIdValue: string | null = record.brandId ?? null;
  return {
    id: record.id,
    brandId: brandIdValue,
    partnerId: record.partnerId,
    standType: record.standType ?? undefined,
    locationAddress: record.locationAddress ?? undefined,
    status: record.status ?? null,

    createdAt: record.createdAt,
    updatedAt: record.updatedAt,

    partner: {
      name: record.partner?.name ?? undefined,
      city: record.partner?.city ?? undefined,
      country: record.partner?.country ?? undefined,
    },
  };
}

// ------------------------------------------------------
// MAIN SERVICE
// ------------------------------------------------------
export const standService = {
  async getDashboardSummary(brandId: string): Promise<StandDashboardSummary> {
    return getDashboardSummaryRecord(brandId);
  },

  // ------------------------------------------
  // LIST
  // ------------------------------------------
  async listStandPartners(params: StandPartnerListParams): Promise<StandPartnerListResponse> {
    const { brandId, search, status, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: StandPartnerWhereInput = { brandId };

    if (status) where.status = status;

    if (search) {
      where.OR = [
        { locationAddress: { contains: search, mode: "insensitive" } },
        { partner: { name: { contains: search, mode: "insensitive" } } },
        { partner: { city: { contains: search, mode: "insensitive" } } },
        { partner: { country: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [total, rows] = await listStandPartnerRecords(where, skip, take);

    const stats = await aggregateStandStats(
      rows.map((row) => row.id),
      brandId,
    );

    return {
      total,
      page,
      pageSize: take,
      items: rows.map((row) => ({
        ...mapStandPartner(row),
        stats: stats.get(row.id),
      })),
    };
  },

  // ------------------------------------------
  // GET ONE
  // ------------------------------------------
  async getStandPartnerById(id: string, brandId: string): Promise<StandPartnerDTO | null> {
    const record = await getStandPartnerRecord(id, brandId);
    if (!record) return null;

    const stats = await aggregateStandStats([id], brandId);
    return {
      ...mapStandPartner(record),
      stats: stats.get(id),
    };
  },

  // ------------------------------------------
  // CREATE
  // ------------------------------------------
  async createStandPartner(input: StandPartnerCreateInput): Promise<StandPartnerDTO> {
    const partner = await findBrandPartnerByIds(input.partnerId, input.brandId);
    if (!partner) throw notFound("Partner not found for this brand");

    const created = await createStandPartnerRecord({
      brandId: input.brandId,
      partnerId: input.partnerId,
      standType: input.standType ?? null,
      locationAddress: input.locationAddress ?? null,
      status: "ACTIVE",
    });

    logger.info(`[stand] Created stand partner ${created.id}`);
    return mapStandPartner(created);
  },

  // ------------------------------------------
  // UPDATE
  // ------------------------------------------
  async updateStandPartner(
    id: string,
    brandId: string,
    input: StandPartnerUpdateInput,
  ): Promise<StandPartnerDTO> {
    const existing = await getStandPartnerRecord(id, brandId);
    if (!existing) throw notFound("Stand partner not found");

    const updated = await updateStandPartnerRecord(id, {
      standType: input.standType ?? existing.standType,
      locationAddress: input.locationAddress ?? existing.locationAddress,
      status: input.status ?? existing.status,
    });

    logger.info(`[stand] Updated stand partner ${updated.id}`);
    return mapStandPartner(updated);
  },

  // ------------------------------------------
  // DEACTIVATE
  // ------------------------------------------
  async deactivateStandPartner(id: string, brandId: string): Promise<StandPartnerDTO> {
    const existing = await getStandPartnerRecord(id, brandId);
    if (!existing) throw notFound("Stand partner not found");

    const updated = await deactivateStandPartnerRecord(id);
    logger.info(`[stand] Deactivated stand partner ${updated.id}`);
    return mapStandPartner(updated);
  },

  // ------------------------------------------
  // STATS
  // ------------------------------------------
  async getStandPartnerStats(id: string, brandId: string): Promise<StandPartnerStatsDTO> {
    const record = await getStandPartnerRecord(id, brandId);
    if (!record) throw notFound("Stand partner not found");

    const stats = await aggregateStandStats([id], brandId);
    return (
      stats.get(id) ?? {
        standPartnerId: id,
        totalUnits: 0,
        totalOrders: 0,
        totalRevenue: 0,
        lastOrderAt: null,
      }
    );
  },
};
