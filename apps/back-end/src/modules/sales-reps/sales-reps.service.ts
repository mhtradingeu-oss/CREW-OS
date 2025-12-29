import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import { publish } from "../../core/events/event-bus.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import {
  emitSalesActivityLogged,
  emitSalesOrderCreated,
  emitSalesPlanGenerated,
} from "./sales-reps.events.js";
/**
 * SALES-REPS SERVICE — MH-OS v2
 * Spec: docs/os/10_sales-rep-program.md (MASTER_INDEX)
 */
import type {
  SalesKpiSummary,
  SalesLeadInput,
  SalesLeadListFilters,
  SalesVisitInput,
  SalesVisitListFilters,
  SalesVisitListResult,
  SalesVisitRecord,
  SalesLeadListResult,
  SalesLeadRecord,
  SalesRepCreateInput,
  SalesRepListFilters,
  SalesRepListResult,
  SalesRepListItem,
  SalesRepUpdateInput,
  SalesRepAiPlanRequest,
  SalesRepAiPlanDto,
} from "./sales-reps.types.js";
import {
  createCrmTask,
  createSalesLead,
  createSalesPlanInsight,
  createSalesRep,
  createSalesRepKpiSnapshot,
  createSalesVisit,
  findSalesRepId,
  getSalesKpiStats,
  getSalesRepDetails,
  listRecentSalesLeads,
  listRecentSalesVisits,
  listSalesLeads,
  listSalesReps,
  listSalesVisits,
  updateSalesRep,
} from "../../core/db/repositories/sales-reps.repository.js";
import {
  createSalesOrderTransaction,
  findDuplicateSalesOrder,
} from "../../core/db/repositories/sales-orders.repository.js";

class SalesRepsService {

  private resolvePagination(filters: { page?: number; pageSize?: number }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(filters.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    return { page, pageSize: take, skip, take };
  }

  async list(filters: SalesRepListFilters): Promise<SalesRepListResult> {
    const { page, pageSize, skip, take } = this.resolvePagination(filters);
    const [total, reps] = await listSalesReps(filters, { skip, take });

    const data: SalesRepListItem[] = reps.map((rep: any) => ({
      id: rep.id,
      brandId: rep.brandId === null ? undefined : rep.brandId,
      userId: rep.userId ?? undefined,
      code: rep.code ?? undefined,
      region: rep.region ?? undefined,
      status: rep.status ?? undefined,
      territoryCount: rep.territories.length,
    }));

    return { items: data, total, page, pageSize };
  }

  async getById(id: string) {
    const rep = await getSalesRepDetails(id);
    if (!rep) {
      throw notFound("Sales rep not found");
    }
    return rep;
  }

  async create(input: SalesRepCreateInput) {
    const rep = await createSalesRep({
      brandId: input.brandId ?? null,
      userId: input.userId ?? null,
      code: input.code,
      region: input.region,
      status: input.status ?? "ACTIVE",
    });
    await publish("sales-reps.rep.created", { repId: rep.id }, { module: "sales-reps" });
    return rep;
  }

  async update(id: string, input: SalesRepUpdateInput) {
    const rep = await updateSalesRep(id, {
      brandId: input.brandId ?? undefined,
      userId: input.userId ?? undefined,
      code: input.code ?? undefined,
      region: input.region ?? undefined,
      status: input.status ?? undefined,
    });
    await publish("sales-reps.rep.updated", { repId: rep.id }, { module: "sales-reps" });
    return rep;
  }

  async listLeads(repId: string, filters: SalesLeadListFilters): Promise<SalesLeadListResult> {
    await this.ensureRepExists(repId);
    const { page, pageSize, skip, take } = this.resolvePagination(filters);
    const [total, leads] = await listSalesLeads(
      { repId, status: filters.status },
      { skip, take },
    );

    const data: SalesLeadRecord[] = leads.map((lead: any) => ({
      id: lead.id,
      repId: lead.repId,
      stage: lead.stage ?? undefined,
      status: lead.status,
      source: lead.source ?? undefined,
      score: lead.score ? Number(lead.score) : undefined,
      nextAction: lead.nextAction ?? undefined,
      createdAt: lead.createdAt,
    }));

    return { items: data, total, page, pageSize };
  }

  async createLead(repId: string, input: SalesLeadInput): Promise<SalesLeadRecord> {
    const rep = await this.ensureRepExists(repId);
    const lead = await createSalesLead({
      repId,
      brandId: rep.brandId ?? null,
      leadId: input.leadId ?? null,
      companyId: input.companyId ?? null,
      territoryId: input.territoryId ?? null,
      source: input.source,
      score: input.score,
      stage: input.stage,
      status: input.status ?? "OPEN",
      nextAction: input.nextAction,
      notes: input.notes,
    });

    await publish("sales-reps.lead.created", { repId, leadId: lead.id }, { module: "sales-reps" });
    // TODO: Trigger AI scoring and follow-up recommendations via the AI Brain.

    return {
      id: lead.id,
      repId: lead.repId,
      stage: lead.stage ?? undefined,
      status: lead.status,
      source: lead.source ?? undefined,
      score: lead.score ? Number(lead.score) : undefined,
      nextAction: lead.nextAction ?? undefined,
      createdAt: lead.createdAt,
    };
  }

  async listVisits(repId: string, filters: SalesVisitListFilters): Promise<SalesVisitListResult> {
    await this.ensureRepExists(repId);
    const { page, pageSize, skip, take } = this.resolvePagination(filters);
    const [total, visits] = await listSalesVisits(
      { repId },
      { skip, take },
    );

    const data: SalesVisitRecord[] = visits.map((visit: any) => ({
      id: visit.id,
      repId: visit.repId,
      partnerId: visit.partnerId ?? undefined,
      date: visit.date ?? undefined,
      purpose: visit.purpose ?? undefined,
      result: visit.result ?? undefined,
      createdAt: visit.createdAt,
    }));

    return { items: data, total, page, pageSize };
  }

  async createVisit(repId: string, input: SalesVisitInput): Promise<SalesVisitRecord> {
    const rep = await this.ensureRepExists(repId);
    const visit = await createSalesVisit({
      repId,
      brandId: rep.brandId ?? null,
      partnerId: input.partnerId ?? null,
      purpose: input.purpose,
      result: input.result,
      date: input.date ? new Date(input.date) : undefined,
    });

    await publish(
      "sales-reps.visit.logged",
      { repId, visitId: visit.id },
      { module: "sales-reps" },
    );

    await emitSalesActivityLogged(
      {
        brandId: rep.brandId === null ? undefined : rep.brandId,
        salesRepId: repId,
        customerId: visit.partnerId ?? undefined,
        summary: `Visit recorded${visit.purpose ? `: ${visit.purpose}` : ""}${
          visit.result ? ` (${visit.result})` : ""
        }`,
      },
      { brandId: rep.brandId === null ? undefined : rep.brandId, module: "sales-reps" },
    );

    return {
      id: visit.id,
      repId: visit.repId,
      partnerId: visit.partnerId ?? undefined,
      date: visit.date ?? undefined,
      purpose: visit.purpose ?? undefined,
      result: visit.result ?? undefined,
      createdAt: visit.createdAt,
    };
  }

  async getKpis(repId: string): Promise<SalesKpiSummary> {
    const rep = await this.ensureRepExists(repId);
    const { leadCount, visitCount, orderAggregate } = await getSalesKpiStats(repId);

    const totalOrders =
      typeof orderAggregate._count === "object" ? orderAggregate._count.id ?? 0 : 0;
    const totalRevenue = Number(
      typeof orderAggregate._sum === "object" ? orderAggregate._sum.total ?? 0 : 0,
    );
    const summary: SalesKpiSummary = {
      repId,
      totalLeads: leadCount,
      totalVisits: visitCount,
      totalOrders,
      totalRevenue,
      lastUpdated: new Date(),
    };

    await createSalesRepKpiSnapshot({
      brandId: rep.brandId ?? null,
      repId,
      period: new Date().toISOString(),
      metricsJson: JSON.stringify({
        totalLeads: leadCount,
        totalVisits: visitCount,
        totalOrders,
        totalRevenue,
      }),
    });

    await publish("sales-reps.kpi.snapshot", { repId }, { module: "sales-reps" });
    // TODO: Surface KPI snapshot and AI insights in the Virtual Office for the Sales Director.

    return summary;
  }

  async getAiPlan(repId: string, input: SalesRepAiPlanRequest): Promise<SalesRepAiPlanDto> {
    const rep = await this.ensureRepExists(repId);

    const [leads, visits] = await Promise.all([
      listRecentSalesLeads(repId, 8),
      listRecentSalesVisits(repId, 5),
    ]);

    const kpis = await this.getKpis(repId);

    // Convert KPI aggregate to array for AI
    // period = fallback to current month window
    const now = new Date();
    const periodStr = now.toISOString().slice(0, 10); // e.g., '2025-12-17'
    const kpisForAI = [
      {
        kpiName: "TOTAL_LEADS",
        value: kpis.totalLeads ?? 0,
        period: periodStr,
      },
      {
        kpiName: "TOTAL_REVENUE",
        value: kpis.totalRevenue ?? 0,
        period: periodStr,
      },
    ];

    const leadContext = leads.map((lead: any) => ({
      leadId: lead.leadId ?? lead.id,
      name: lead.leadId ?? undefined,
      stage: lead.stage ?? undefined,
      status: lead.status,
      score: lead.score ? Number(lead.score) : undefined,
      lastInteraction: lead.updatedAt.toISOString(),
      nextAction: lead.nextAction ?? undefined,
      source: lead.source ?? undefined,
    }));

    const visitContext = visits.map((visit: any) => ({
      visitId: visit.id,
      partnerId: visit.partnerId ?? undefined,
      purpose: visit.purpose ?? undefined,
      result: visit.result ?? undefined,
      date: visit.date ? visit.date.toISOString() : undefined,
    }));

    const aiResponse = await aiOrchestrator.generateSalesRepPlan({
      brandId: rep.brandId === null ? undefined : rep.brandId,
      repId,
      scope: input.scope,
      notes: input.notes,
      leads: leadContext,
      visits: visitContext,
      kpis: kpisForAI[0] ?? { kpiName: "TOTAL_LEADS", value: 0, period: periodStr },
    });

    // TODO: Pipe AI-prioritized leads into CRM tasks or automation once approvals exist.
    const planResult = aiResponse.result;
    const planTasks = await this.createCrmTasksFromPlan(rep, planResult.suggestedActions ?? []);
    await this.logSalesPlanInsight(rep, planResult, leadContext, planTasks);
    await emitSalesPlanGenerated(
      {
        repId,
        brandId: rep.brandId === null ? undefined : rep.brandId,
        leadIds: Array.from(new Set(planTasks.map((task: any) => task.leadId))),
        taskCount: planTasks.length,
        summary: planResult.summary ?? undefined,
      },
      { brandId: rep.brandId === null ? undefined : rep.brandId, module: "sales-reps" },
    );
    return planResult;
  }

  private async ensureRepExists(repId: string) {
    const rep = await findSalesRepId(repId);
    if (!rep) {
      throw notFound("Sales rep not found");
    }

    return rep;
  }

  private async createCrmTasksFromPlan(
    rep: { id: string; brandId?: string | null; userId?: string | null },
    actions: SalesRepAiPlanDto["suggestedActions"] | undefined,
  ): Promise<Array<{ taskId: string; leadId: string }>> {
    if (!actions?.length) return [];
    const brandId = rep.brandId ?? null;
    const created: Array<{ taskId: string; leadId: string }> = [];

    for (const action of actions) {
      if (!action.leadId) continue;
      const title = action.description?.trim() || `Follow up ${action.type}`;
      const task = await createCrmTask({
        brandId,
        leadId: action.leadId,
        title,
        status: "OPEN",
        assignedToId: rep.userId ?? undefined,
      });
      await publish(
        "crm.task.created",
        { taskId: task.id, brandId: task.brandId ?? undefined },
        { brandId: task.brandId ?? undefined, module: "sales-reps" },
      );
      created.push({ taskId: task.id, leadId: action.leadId });
    }

    return created;
  }

  private async logSalesPlanInsight(
    rep: { id: string; brandId?: string | null },
    plan: SalesRepAiPlanDto,
    leads: Array<{ leadId: string; name?: string }>,
    createdTasks: Array<{ taskId: string; leadId: string }>,
  ) {
    await createSalesPlanInsight({
      brandId: rep.brandId ?? null,
      os: "sales",
      entityType: "sales-plan",
      entityId: rep.id,
      summary: plan.summary ?? "AI sales plan summary",
      details: JSON.stringify({
        plan,
        leads,
        tasks: createdTasks,
      }),
    });
  }
}

export const sales_repsService = new SalesRepsService();

// PHASE B: Core Revenue Flow — Create Order with Pricing Snapshot and Inventory Adjustment
import { inventoryService } from "../inventory/inventory.service.js";
import { pricingService } from "../pricing/pricing.service.js";
import { emitPricingSnapshotAccessed } from "../pricing/pricing.events.js";
import {
  emitFinanceCreated,
  emitFinanceInvoiceCreated,
} from "../finance/finance.events.js";

type CreateSalesOrderInput = {
  repId: string;
  productId: string;
  quantity: number;
  warehouseId: string;
  brandId?: string;
};

export async function createSalesOrderWithPricingAndInventory(input: CreateSalesOrderInput) {
  if (!input.brandId) {
    throw new Error("brandId is required");
  }
  const brandId = input.brandId;
  // 0. Idempotency guard: check for duplicate order in last 60s
  const now = new Date();
  const windowStart = new Date(now.getTime() - 60 * 1000);
  const duplicate = await findDuplicateSalesOrder({
    repId: input.repId,
    brandId,
    productId: input.productId,
    quantity: input.quantity,
    windowStart,
  });
  if (duplicate) {
    throw new Error("Duplicate order detected: similar order already exists within 60 seconds");
  }

  // 1. Fetch latest pricing snapshot approved for the brand
  const pricing = await pricingService.getById(input.productId);
  if (!pricing) throw notFound("Pricing not found for product");
  if (pricing.brandId && pricing.brandId !== brandId) {
    throw badRequest("Pricing snapshot is not approved for this brand");
  }
  await emitPricingSnapshotAccessed(
    {
      id: pricing.id,
      productId: pricing.productId,
      brandId: pricing.brandId ?? brandId,
    },
    { brandId },
  );

  // 2. Check and adjust inventory atomically
  const inventoryItem = await inventoryService.getInventoryItem(input.productId, brandId);
  if (!inventoryItem) throw notFound("Inventory item not found for product");
  if (inventoryItem.quantity < input.quantity) throw new Error("Insufficient stock");

  // استخدم تقريب آمن للمبالغ المالية (2 منازل عشرية)
  const unitPrice = Number(pricing.basePrice);
  const rawAmount = unitPrice * input.quantity;
  const amount = Math.round(rawAmount * 100) / 100;
  const roundedUnitPrice = Math.round(unitPrice * 100) / 100;

  // 3. Transaction: create order, adjust inventory, create invoice, revenue record
  const transactionResult = await createSalesOrderTransaction(
    {
      repId: input.repId,
      brandId,
      productId: input.productId,
      quantity: input.quantity,
      total: amount,
      unitPrice: roundedUnitPrice,
      invoiceCurrency: pricing.currency ?? "EUR",
      invoiceStatus: "draft",
      invoiceIssuedAt: new Date(),
      revenueCurrency: pricing.currency ?? "EUR",
      revenuePeriodStart: new Date(),
      revenuePeriodEnd: null,
      inventoryAdjustment: {
        inventoryItemId: inventoryItem.id,
        delta: -input.quantity,
        reason: `Order placed by sales rep ${input.repId}`,
        brandId,
      },
    },
    async (adjustment) => {
      await inventoryService.createInventoryAdjustment(
        {
          inventoryItemId: adjustment.inventoryItemId,
          brandId: adjustment.brandId ?? brandId,
          delta: adjustment.delta,
          reason: adjustment.reason,
        },
      );
    },
  );
  const result = { ...transactionResult, pricingSnapshot: pricing };

  const invoiceAmount = Number(result.invoice.amount ?? amount);
  const invoiceCurrency = result.invoice.currency ?? pricing.currency ?? "EUR";
  await emitFinanceInvoiceCreated(
    {
      invoiceId: result.invoice.id,
      brandId,
      amount: invoiceAmount,
      currency: invoiceCurrency,
      status: result.invoice.status ?? "draft",
    },
    { brandId, source: "api" },
  );

  await emitFinanceCreated(
    { id: result.revenueRecord.id, brandId },
    { brandId, source: "api" },
  );

  await emitSalesOrderCreated(
    {
      orderId: result.order.id,
      brandId,
      productId: input.productId,
      quantity: input.quantity,
      unitPrice: roundedUnitPrice,
      totalAmount: amount,
      invoiceId: result.invoice.id,
      revenueRecordId: result.revenueRecord.id,
    },
    { brandId, source: "api" },
  );

  return result;
}
