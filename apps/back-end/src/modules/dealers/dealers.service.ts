/**
 * DEALERS SERVICE — MH-OS v2
 * Spec: docs/os/20_partner-os.md (MASTER_INDEX)
 */


import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import {
  DealerKpiDTO,
  DealerKpiListParams,
  DealerKpiListResponse,
  PartnerCreateInput,
  PartnerDTO,
  PartnerListParams,
  PartnerListResponse,
  PartnerStatsDTO,
  PartnerUpdateInput,
  DealersDashboardSummary,
} from "./dealers.types.js";
import {
  emitDealersCreated,
  emitDealersDeleted,
  emitDealersKpiUpdated,
  emitDealersUpdated,
} from "./dealers.events.js";
import {
  computeDealerKpiData,
  deactivatePartnerRecord,
  findDealerKpi,
  findPartnerByBrandAndName,
  findPartnerByIdAndBrand,
  findPartnerName,
  getDashboardSummaryAggregates,
  listDealerKpis,
  listPartners,
  upsertDealerKpi,
  createPartnerRecord,
  updatePartnerRecord,
} from "../../core/db/repositories/dealers.repository.js";
import type {
  DealerKpiPayload,
  DealerKpiWhereInput,
  PartnerPayload,
  PartnerWhereInput,
} from "../../core/db/repositories/dealers.repository.js";

function mapDealerKpi(
  record: DealerKpiPayload,
): DealerKpiDTO {
  return {
    partnerId: record.partnerId,
    brandId: record.brandId ?? undefined,
    totalOrders: record.totalOrders,
    totalRevenue: Number(record.totalRevenue ?? 0),
    totalUnits: record.totalUnits,
    activeStands: record.activeStands,
    engagementScore: record.engagementScore ?? undefined,
    lastOrderAt: record.lastOrderAt ?? undefined,
  };
}

function kpiToStats(kpi: DealerKpiDTO): PartnerStatsDTO {
  return {
    totalOrders: kpi.totalOrders,
    totalRevenue: kpi.totalRevenue,
    lastOrderAt: kpi.lastOrderAt ?? null,
    totalUnits: kpi.totalUnits,
    activeStands: kpi.activeStands,
    engagementScore: kpi.engagementScore,
  };
}

function mapPartner(record: PartnerPayload): PartnerDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    type: record.type,
    name: record.name,
    country: record.country,
    city: record.city,
    status: record.status ?? undefined,
    tier: record.tier
      ? {
          id: record.tier.id,
          name: record.tier.name,
          benefits: record.tier.benefits,
        }
      : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    settingsJson: record.settingsJson,
  };
}



export const dealersService = {
  async getDashboardSummary(brandId: string): Promise<DealersDashboardSummary> {
    const { totalPartners, activePartners, ordersAgg, totalStands, topCountries } =
      await getDashboardSummaryAggregates(brandId);

    return {
      totalPartners,
      activePartners,
      totalOrders: ordersAgg._count.id ?? 0,
      totalRevenue: Number(ordersAgg._sum.total ?? 0),
      totalStands,
      topCountries: topCountries.map((row) => ({
        country: row.country ?? "unknown",
        partners: typeof row._count === "object" && row._count ? row._count.id ?? 0 : 0,
      })),
    };
  },

  async listPartners(params: PartnerListParams): Promise<PartnerListResponse> {
    const { brandId, search, active, tierId } = params;
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: PartnerWhereInput = { brandId };

    if (active !== undefined) {
      where.status = active ? "ACTIVE" : { not: "ACTIVE" };
    }
    if (tierId) where.tierId = tierId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { country: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await listPartners(where, { skip, take });

    return {
      items: rows.map((item: any) => mapPartner(item)),
      total,
      page,
      pageSize: take,
    };
  },

  async getPartnerById(partnerId: string, brandId: string): Promise<PartnerDTO | null> {
    const record = await findPartnerByIdAndBrand(partnerId, brandId);
    if (!record) return null;
    const dto = mapPartner(record);
    const kpi = await this.getDealerKpi(partnerId, brandId);
    return { ...dto, stats: kpiToStats(kpi) };
  },

  async createPartner(input: PartnerCreateInput): Promise<PartnerDTO> {
    const existing = await findPartnerByBrandAndName(input.brandId, input.name);
    if (existing) {
      throw badRequest("Partner with this name already exists");
    }

    const created = await createPartnerRecord({
      brandId: input.brandId,
      type: input.type,
      name: input.name,
      country: input.country ?? null,
      city: input.city ?? null,
      tierId: input.tierId ?? null,
      settingsJson:
        typeof input.settingsJson === "string"
          ? input.settingsJson
          : JSON.stringify(input.settingsJson ?? {}),
      status: input.status ?? "ACTIVE",
    });

    logger.info(`[partners] Created partner ${created.name} for brand ${input.brandId}`);
    await emitDealersCreated({
      brandId: created.brandId ?? undefined,
      partnerId: created.id,
      action: "created",
    });
    return mapPartner(created);
  },

  async updatePartner(
    partnerId: string,
    brandId: string,
    input: PartnerUpdateInput,
  ): Promise<PartnerDTO> {
    const existing = await findPartnerByIdAndBrand(partnerId, brandId);
    if (!existing) throw notFound("Partner not found");

    const updated = await updatePartnerRecord(partnerId, {
      type: input.type ?? undefined,
      name: input.name ?? undefined,
      country: input.country ?? undefined,
      city: input.city ?? undefined,
      tierId: input.tierId ?? undefined,
      settingsJson:
        input.settingsJson !== undefined
          ? typeof input.settingsJson === "string"
            ? input.settingsJson
            : JSON.stringify(input.settingsJson)
          : existing.settingsJson === null
          ? undefined
          : existing.settingsJson,
      status: input.status ?? existing.status,
    });

    logger.info(`[partners] Updated partner ${updated.id}`);
    await emitDealersUpdated({
      brandId: updated.brandId ?? undefined,
      partnerId: updated.id,
      action: "updated",
    });
    return mapPartner(updated);
  },

  async deactivatePartner(partnerId: string, brandId: string): Promise<PartnerDTO> {
    const existing = await findPartnerByIdAndBrand(partnerId, brandId);
    if (!existing) throw notFound("Partner not found");

    const updated = await deactivatePartnerRecord(partnerId);

    logger.info(`[partners] Deactivated partner ${partnerId}`);
    await emitDealersDeleted({
      brandId: updated.brandId ?? undefined,
      partnerId: updated.id,
      action: "deleted",
    });
    return mapPartner(updated);
  },

  async getPartnerStats(partnerId: string, brandId: string): Promise<PartnerStatsDTO> {
    const kpi = await this.getDealerKpi(partnerId, brandId);
    return kpiToStats(kpi);
  },

  async getDealerKpi(partnerId: string, brandId: string): Promise<DealerKpiDTO> {
    if (!brandId) throw badRequest("brandId is required");
    const record = await findDealerKpi(partnerId, brandId);
    if (record) return mapDealerKpi(record);
    return this.recalculateDealerKpi(partnerId, brandId);
  },

  async listDealerKpis(params: DealerKpiListParams): Promise<DealerKpiListResponse> {
    const { brandId } = params;
    if (!brandId) throw badRequest("brandId is required");
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: DealerKpiWhereInput = { brandId };
    const [total, rows] = await listDealerKpis(where, { skip, take });
    return {
      items: rows.map((record: any) => ({
        ...mapDealerKpi(record),
        partnerName: record.partner?.name ?? undefined,
      })),
      total,
      page,
      pageSize: take,
    };
  },

  async recalculateDealerKpi(partnerId: string, brandId: string): Promise<DealerKpiDTO> {
    if (!brandId) throw badRequest("brandId is required");
    const kpiData = await computeDealerKpiData(partnerId, brandId);
    const record = await upsertDealerKpi(partnerId, brandId, kpiData);
    const partner = await findPartnerName(partnerId);
    const dto = mapDealerKpi(record);
    await emitDealersKpiUpdated(
      {
        ...dto,
        partnerName: partner?.name ?? undefined,
      },
      {
        brandId,
        module: "dealers",
        source: "api",
      },
    );
    return dto;
  },
};
