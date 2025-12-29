import pkg from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { StandLocation } from "@prisma/client";
import type { StandPerformanceBrief } from "../ai-brain/ai-brain.types.js";
import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import { prisma } from "../../core/prisma.js";
import { publish } from "../../core/events/event-bus.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import {
  emitStandKpiUpdated,
  emitStandPerformanceRegressed,
  emitStandStockLow,
  emitStandStockoutRepeated,
} from "./stand-pos.events.js";
import type {
  StandAiStockRequest,
  StandCreateInput,
  StandInventoryResponse,
  StandInsightResult,
  StandKpiDTO,
  StandKpiListParams,
  StandKpiListResponse,
  StandListFilters,
  StandListResult,
  StandLocationInput,
  StandPerformanceSummary,
  StandRefillInput,
  StandRefillResult,
  StandStockEventPayload,
  StandUpdateInput,
} from "./stand-pos.types.js";

const LOW_STOCK_THRESHOLD = 5;
const STOCK_OUT_THRESHOLD = 0;
const REGRESSION_ALERT_PERCENT = 15;

const standKpiSelect = {
  id: true,
  standId: true,
  brandId: true,
  totalSales: true,
  totalUnits: true,
  stockOutEvents: true,
  lastSaleAt: true,
  lastStockOutAt: true,
  regressionScore: true,
  engagementScore: true,
  createdAt: true,
  updatedAt: true,
  stand: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.StandKpiSelect;

function mapStandKpi(
  record: Prisma.StandKpiGetPayload<{ select: typeof standKpiSelect }>,
): StandKpiDTO {
  return {
    standId: record.standId,
    brandId: record.brandId ?? undefined,
    totalSales: Number(record.totalSales ?? 0),
    totalUnits: record.totalUnits,
    stockOutEvents: record.stockOutEvents,
    lastSaleAt: record.lastSaleAt ?? undefined,
    lastStockOutAt: record.lastStockOutAt ?? undefined,
    regressionScore: record.regressionScore ?? undefined,
    engagementScore: record.engagementScore ?? undefined,
    standName: record.stand?.name ?? undefined,
  };
}

function mapPerformanceSummaryToBrief(
  summary: StandPerformanceSummary,
): StandPerformanceBrief {
  return {
    standId: summary.standId,
    standName: summary.standName,
    totalOrders: summary.totalOrders,
    totalRevenue: summary.totalRevenue,
    stockOutLocations: summary.stockOutLocations,
    refillOrdersPending: summary.refillOrdersPending,
    lastRefillAt: summary.lastRefillAt ? summary.lastRefillAt.toISOString() : undefined,
    latestSnapshot: summary.latestSnapshot,
  };
}

type StandKpiBuildResult = {
  totalSales: number;
  totalUnits: number;
  stockOutEvents: number;
  lastSaleAt?: Date | null;
  lastStockOutAt?: Date | null;
  engagementScore: number;
  lowStockProducts: Array<{ productId: string; quantity: number; updatedAt: Date }>;
  stockoutRecords: Array<{ productId: string; updatedAt: Date }>;
};

const { Prisma: PrismaNamespace } = pkg;

class StandPosService {
  constructor(private readonly db = prisma) {}

  async list(filters: StandListFilters): Promise<StandListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(filters.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.StandWhereInput = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.partnerId) where.standPartnerId = filters.partnerId;
    if (filters.status) where.status = filters.status;

    const [total, records] = await this.db.$transaction([
      this.db.stand.count({ where }),
      this.db.stand.findMany({
        where,
        include: {
          standPartner: {
            include: {
              partner: { select: { id: true, name: true } },
            },
          },
          locations: true,
          performanceSnapshots: { orderBy: { createdAt: "desc" }, take: 1 },
          refillOrders: { orderBy: { expectedAt: "desc", createdAt: "desc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: records.map((stand) => ({
        id: stand.id,
        name: stand.name,
        standType: stand.standType ?? undefined,
        description: stand.description ?? undefined,
        status: stand.status,
        brandId: stand.brandId ?? undefined,
        partner: stand.standPartner?.partner
          ? {
              id: stand.standPartner.partner.id,
              name: stand.standPartner.partner.name ?? undefined,
              status: stand.standPartner.status ?? undefined,
            }
          : undefined,
        locationCount: stand.locations.length,
        latestSnapshot: stand.performanceSnapshots[0]
          ? {
              period: stand.performanceSnapshots[0].period ?? undefined,
              metrics: stand.performanceSnapshots[0].metricsJson
                ? JSON.parse(stand.performanceSnapshots[0].metricsJson)
                : undefined,
            }
          : undefined,
        lastRefillAt:
          stand.refillOrders[0]?.completedAt ?? stand.refillOrders[0]?.expectedAt ?? undefined,
      })),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string) {
    const stand = await this.db.stand.findUnique({
      where: { id },
      include: {
        standPartner: {
          include: {
            partner: { select: { id: true, name: true } },
          },
        },
        locations: {
          include: {
            inventories: { include: { product: { select: { id: true, name: true } } } },
          },
        },
        packages: true,
      },
    });

    if (!stand) {
      throw notFound("Stand not found");
    }

    return stand;
  }

  async create(input: StandCreateInput) {
    const stand = await this.db.stand.create({
      data: {
        brandId: input.brandId ?? null,
        standPartnerId: input.standPartnerId,
        name: input.name,
        standType: input.standType,
        description: input.description,
        status: input.status ?? "ACTIVE",
      },
    });

    if (input.initialLocation) {
      await this.createLocation(stand.id, stand.standPartnerId, input.initialLocation);
    }

    await publish(
      "stand-pos.stand.created",
      { standId: stand.id, brandId: stand.brandId ?? undefined },
      { module: "stand-pos" },
    );

    return stand;
  }

  async update(id: string, input: StandUpdateInput) {
    const stand = await this.db.stand.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        standType: input.standType ?? undefined,
        description: input.description ?? undefined,
        status: input.status ?? undefined,
      },
    });

    await publish("stand-pos.stand.updated", { standId: stand.id }, { module: "stand-pos" });
    return stand;
  }

  async getInventory(standId: string, standLocationId?: string): Promise<StandInventoryResponse[]> {
    const locations = await this.db.standLocation.findMany({
      where: {
        standId,
        ...(standLocationId ? { id: standLocationId } : {}),
      },
      include: {
        inventories: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    if (!locations.length) {
      return [];
    }

    return locations.map((location) => ({
      locationId: location.id,
      locationName: location.name,
      inventory: location.inventories.map((record) => ({
        productId: record.productId,
        productName: record.product?.name ?? undefined,
        quantity: record.quantity,
        status: record.status ?? undefined,
        lastRefillAt: record.lastRefillAt ?? undefined,
      })),
    }));
  }

  async createRefill(standId: string, data: StandRefillInput): Promise<StandRefillResult> {
    const location = await this.db.standLocation.findFirst({
      where: { id: data.standLocationId, standId },
      include: { stand: { select: { id: true, standPartnerId: true, name: true, brandId: true } } },
    });

    if (!location) {
      throw notFound("Stand location not found");
    }

    const standUnitId = await this.ensureLocationUnit(
      location,
      location.stand.standPartnerId,
      location.name,
    );

    const order = await this.db.standRefillOrder.create({
      data: {
        brandId: location.stand.brandId ?? null,
        standId,
        standLocationId: location.id,
        partnerId: data.partnerId ?? location.stand.standPartnerId,
        status: "PLANNED",
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : undefined,
        source: data.source,
        notes: data.notes,
      },
    });

    const now = new Date();

    await Promise.all(
      data.items.map(async (item) => {
        await this.db.standRefillItem.create({
          data: {
            refillOrderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            cost: item.cost ? new PrismaNamespace.Decimal(item.cost) : undefined,
            refillSource: item.refillSource,
          },
        });

        const existingInventory = await this.db.standInventory.findFirst({
          where: {
            standLocationId: location.id,
            productId: item.productId,
          },
        });

        if (existingInventory) {
          await this.db.standInventory.update({
            where: { id: existingInventory.id },
            data: {
              quantity: { increment: item.quantity },
              lastRefillAt: now,
            },
          });
        } else {
          await this.db.standInventory.create({
            data: {
              standUnitId,
              standLocationId: location.id,
              productId: item.productId,
              quantity: item.quantity,
              status: "ACTIVE",
              lastRefillAt: now,
            },
          });
        }
      }),
    );

    await this.db.standPerformanceSnapshot.create({
      data: {
        standId,
        standLocationId: location.id,
        brandId: location.stand.brandId ?? null,
        period: new Date().toISOString(),
        metricsJson: JSON.stringify({
          itemsRefilled: data.items.length,
          totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
        }),
      },
    });

    await publish(
      "stand-pos.refill.created",
      { standId, standLocationId: location.id, refillOrderId: order.id },
      { module: "stand-pos" },
    );

    // TODO: Invoke AI Brain/Virtual Office when refill performance falls below expected cadence.

    return {
      id: order.id,
      status: order.status ?? "PLANNED",
      standLocationId: location.id,
      expectedAt: order.expectedAt ?? undefined,
    };
  }

  async getPerformance(standId: string): Promise<StandPerformanceSummary> {
    const stand = await this.db.stand.findUnique({ where: { id: standId } });
    if (!stand) {
      throw notFound("Stand not found");
    }

    const [orders, pendingRefills, latestSnapshot, lastRefill] = await this.db.$transaction([
      this.db.standOrder.aggregate({
        where: { standId },
        _count: { id: true },
        _sum: { total: true },
      }),
      this.db.standRefillOrder.count({
        where: { standId, status: "PLANNED" },
      }),
      this.db.standPerformanceSnapshot.findFirst({
        where: { standId },
        orderBy: { createdAt: "desc" },
      }),
      this.db.standRefillOrder.findFirst({
        where: { standId, expectedAt: { not: null } },
        orderBy: { expectedAt: "desc" },
        select: { expectedAt: true },
      }),
    ]);

    const stockOutEntries = await this.db.standInventory.count({
      where: {
        standLocation: {
          standId,
        },
        quantity: { lte: 0 },
      },
    });

    const summary: StandPerformanceSummary = {
      standId,
      standName: stand.name,
      totalOrders: orders._count?.id ?? 0,
      totalRevenue: Number(orders._sum?.total ?? 0),
      stockOutLocations: stockOutEntries,
      refillOrdersPending: pendingRefills,
      lastRefillAt: lastRefill?.expectedAt ?? undefined,
      latestSnapshot: latestSnapshot
        ? {
            period: latestSnapshot.period ?? undefined,
            metrics: latestSnapshot.metricsJson
              ? JSON.parse(latestSnapshot.metricsJson)
              : undefined,
          }
        : undefined,
    };

    await publish(
      "stand-pos.performance.reviewed",
      { standId, standName: stand.name },
      { module: "stand-pos", severity: "info" },
    );

    // TODO: Queue automation/notifications when stock-out counts rise or KPI snapshots regress.

    return summary;
  }

  async getAiStockSuggestion(standId: string, input: StandAiStockRequest) {
    const { stand, inventorySnapshot } = await this.buildStandInventorySnapshot(standId);
    const performance = await this.getPerformance(standId);
    const performanceBrief = mapPerformanceSummaryToBrief(performance);

    const aiResponse = await aiOrchestrator.generateStandStockSuggestion({
      brandId: stand.brandId ?? undefined,
      standId,
      scope: input.scope,
      notes: input.notes,
      inventorySnapshot,
      performance: performanceBrief,
    });

    // TODO: Once automation drafts exist, route low-stock suggestions directly into refill orders.
    return aiResponse.result;
  }

  async listStandKpis(params: StandKpiListParams): Promise<StandKpiListResponse> {
    const { brandId } = params;
    if (!brandId) throw badRequest("brandId is required");
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.StandKpiWhereInput = { brandId };
    const [total, records] = await this.db.$transaction([
      this.db.standKpi.count({ where }),
      this.db.standKpi.findMany({
        where,
        select: standKpiSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);
    return {
      items: records.map(mapStandKpi),
      total,
      page,
      pageSize: take,
    };
  }

  async getStandKpi(standId: string, brandId: string): Promise<StandKpiDTO> {
    if (!brandId) throw badRequest("brandId is required");
    const record = await this.db.standKpi.findUnique({
      where: { standId_brandId: { standId, brandId } },
      select: standKpiSelect,
    });
    if (record) return mapStandKpi(record);
    return this.recalculateStandKpi(standId, brandId);
  }

  async recalculateStandKpi(standId: string, brandId: string): Promise<StandKpiDTO> {
    if (!brandId) throw badRequest("brandId is required");
    const stand = await this.ensureStandForBrand(standId, brandId);
    const previous = await this.db.standKpi.findUnique({
      where: { standId_brandId: { standId, brandId } },
    });
    const kpiData = await this.buildStandKpiData(standId);
    const regressionScore =
      previous && previous.totalSales
        ? Math.max(
            0,
            Math.min(
              100,
              Math.round(
                ((Number(previous.totalSales ?? 0) - kpiData.totalSales) /
                  Math.max(Number(previous.totalSales ?? 0), 1)) *
                  100,
              ),
            ),
          )
        : undefined;

    const record = await this.db.standKpi.upsert({
      where: { standId_brandId: { standId, brandId } },
      create: {
        standId,
        brandId,
        totalSales: new PrismaNamespace.Decimal(kpiData.totalSales),
        totalUnits: kpiData.totalUnits,
        stockOutEvents: kpiData.stockOutEvents,
        lastSaleAt: kpiData.lastSaleAt,
        lastStockOutAt: kpiData.lastStockOutAt,
        engagementScore: kpiData.engagementScore,
        regressionScore,
      },
      update: {
        totalSales: new PrismaNamespace.Decimal(kpiData.totalSales),
        totalUnits: kpiData.totalUnits,
        stockOutEvents: kpiData.stockOutEvents,
        lastSaleAt: kpiData.lastSaleAt,
        lastStockOutAt: kpiData.lastStockOutAt,
        engagementScore: kpiData.engagementScore,
        regressionScore,
      },
      select: standKpiSelect,
    });

    const dto = mapStandKpi(record);
    const context = { brandId, module: "stand-pos" };

    await emitStandKpiUpdated(
      { ...dto, standName: stand.name },
      context,
    );

    if (regressionScore && regressionScore >= REGRESSION_ALERT_PERCENT) {
      await emitStandPerformanceRegressed(
        {
          brandId,
          standId,
          standName: stand.name,
          totalSales: dto.totalSales,
          totalUnits: dto.totalUnits,
          stockOutEvents: dto.stockOutEvents,
          regressionScore,
        },
        context,
      );
    }

    if (kpiData.lowStockProducts.length) {
      await Promise.all(
        kpiData.lowStockProducts.map((entry) =>
          emitStandStockLow(
            {
              brandId,
              standId,
              productId: entry.productId,
              count: Math.max(1, entry.quantity),
              lastStockOutAt: entry.updatedAt,
            },
            context,
          ),
        ),
      );
    }

    const repeatedCandidate = kpiData.stockoutRecords.find(
      (entry) =>
        previous?.lastStockOutAt &&
        entry.updatedAt > previous.lastStockOutAt &&
        kpiData.stockOutEvents > 0,
    );
    if (repeatedCandidate) {
      await emitStandStockoutRepeated(
        {
          brandId,
          standId,
          productId: repeatedCandidate.productId,
          count: kpiData.stockOutEvents,
          lastStockOutAt: repeatedCandidate.updatedAt,
        },
        context,
      );
    }

    return dto;
  }

  async getStandInsights(standId: string, brandId: string): Promise<StandInsightResult> {
    if (!brandId) throw badRequest("brandId is required");
    const stand = await this.ensureStandForBrand(standId, brandId);
    const performance = await this.getPerformance(standId);
    const { inventorySnapshot } = await this.buildStandInventorySnapshot(standId);
    const aiResponse = await aiOrchestrator.generateStandStockSuggestion({
      brandId,
      standId,
      inventorySnapshot,
      performance: mapPerformanceSummaryToBrief(performance),
    });
    const result = aiResponse.result;
    await this.db.aIInsight.create({
      data: {
        brandId,
        os: "stand",
        entityType: "stand",
        entityId: standId,
        summary: result.summary,
        details: JSON.stringify(result),
      },
    });

    return {
      summary: result.summary,
      recommendation: result.slowMovers?.[0]?.suggestion ?? result.lowStock?.[0]?.reason,
      details: JSON.stringify(result),
      ai: result,
    };
  }

  private async buildStandInventorySnapshot(standId: string) {
    const stand = await this.db.stand.findUnique({
      where: { id: standId },
      include: {
        locations: {
          include: {
            inventories: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
              },
            },
          },
        },
      },
    });

    if (!stand) {
      throw notFound("Stand not found");
    }

    const inventorySnapshot = stand.locations.flatMap((location) =>
      location.inventories.map((inventory) => ({
        locationId: location.id,
        locationName: location.name ?? undefined,
        productId: inventory.productId,
        sku: inventory.product?.sku ?? undefined,
        name: inventory.product?.name ?? undefined,
        quantity: inventory.quantity,
        status: inventory.status ?? undefined,
        lastRefillAt: inventory.lastRefillAt?.toISOString(),
      })),
    );

    return { stand, inventorySnapshot };
  }

  private async ensureStandForBrand(standId: string, brandId: string) {
    const stand = await this.db.stand.findUnique({
      where: { id: standId },
      select: { id: true, brandId: true, name: true },
    });
    if (!stand) {
      throw notFound("Stand not found");
    }
    if (stand.brandId && stand.brandId !== brandId) {
      throw badRequest("Stand does not belong to the requested brand");
    }
    return stand;
  }

  private async buildStandKpiData(standId: string): Promise<StandKpiBuildResult> {
    const [salesAgg, unitsAgg, stockOutAgg, lowStockRecords, stockoutRecords] =
      await Promise.all([
        this.db.standOrder.aggregate({
          where: { standId },
          _sum: { total: true },
          _max: { createdAt: true },
        }),
        this.db.standOrderItem.aggregate({
          where: { order: { standId } },
          _sum: { quantity: true },
        }),
        this.db.standInventory.aggregate({
          where: {
            standLocation: { standId },
            quantity: { lte: STOCK_OUT_THRESHOLD },
          },
          _count: { id: true },
          _max: { updatedAt: true },
        }),
        this.db.standInventory.findMany({
          where: {
            standLocation: { standId },
            quantity: { lte: LOW_STOCK_THRESHOLD },
          },
          select: { productId: true, quantity: true, updatedAt: true },
        }),
        this.db.standInventory.findMany({
          where: {
            standLocation: { standId },
            quantity: { lte: STOCK_OUT_THRESHOLD },
          },
          select: { productId: true, updatedAt: true },
        }),
      ]);

    const totalSales = Number(salesAgg._sum.total ?? 0);
    const totalUnits = unitsAgg._sum.quantity ?? 0;
    const stockOutEvents = stockOutAgg._count.id ?? 0;
    const lastSaleAt = salesAgg._max.createdAt ?? null;
    const lastStockOutAt = stockOutAgg._max.updatedAt ?? null;
    const engagementScore = Math.min(
      100,
      Math.max(0, totalSales / 1000 + totalUnits / 20 - stockOutEvents * 3),
    );

    return {
      totalSales,
      totalUnits,
      stockOutEvents,
      lastSaleAt,
      lastStockOutAt,
      engagementScore,
      lowStockProducts: lowStockRecords.map((entry) => ({
        productId: entry.productId,
        quantity: entry.quantity,
        updatedAt: entry.updatedAt,
      })),
      stockoutRecords: stockoutRecords.map((entry) => ({
        productId: entry.productId,
        updatedAt: entry.updatedAt,
      })),
    };
  }

  private async createLocation(standId: string, partnerId: string, input: StandLocationInput) {
    const location = await this.db.standLocation.create({
      data: {
        standId,
        name: input.name,
        address: input.address,
        city: input.city,
        country: input.country,
        region: input.region,
        geoLocationJson: input.geoLocationJson,
      },
    });
    await this.ensureLocationUnit(location, partnerId, input.name);
    return location;
  }

  private async ensureLocationUnit(
    location: StandLocation,
    partnerId: string,
    locationName?: string,
  ) {
    const code = `loc-${location.id}`;
    const existing = await this.db.standUnit.findFirst({
      where: {
        standId: location.standId,
        code,
      },
    });

    if (existing) {
      return existing.id;
    }

    const unit = await this.db.standUnit.create({
      data: {
        standPartnerId: partnerId,
        standId: location.standId,
        code,
        locationDescription: locationName,
        status: "ACTIVE",
      },
    });

    return unit.id;
  }
}

export const standPosService = new StandPosService();
