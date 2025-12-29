// --- Autonomy/AISuggestion persistence ---
import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function findAISuggestions<T extends Prisma.AISuggestionFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.AISuggestionFindManyArgs>,
): Promise<Array<Prisma.AISuggestionGetPayload<T>>> {
  return prisma.aISuggestion.findMany(args);
}

export async function updateAISuggestion(
  id: string,
  data: Partial<Prisma.AISuggestionUpdateInput>,
) {
  return prisma.aISuggestion.update({ where: { id }, data });
}

export async function createAISuggestion(
  data: Prisma.AISuggestionCreateInput,
) {
  return prisma.aISuggestion.create({ data });
}

export type ProductPricingWithProduct = Prisma.ProductPricingGetPayload<{
  include: {
    product: { select: { id: true; name: true; brandId: true; slug: true } };
  };
}>;

export async function getRecentProductPricings(): Promise<ProductPricingWithProduct[]> {
  return prisma.productPricing.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { product: { select: { id: true, name: true, brandId: true, slug: true } } },
  });
}

export async function findProductPricings<
  T extends Prisma.ProductPricingFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.ProductPricingFindManyArgs>): Promise<Array<Prisma.ProductPricingGetPayload<T>>> {
  return prisma.productPricing.findMany(args);
}

export async function findPricingHistory<
  T extends Prisma.AIPricingHistoryFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.AIPricingHistoryFindManyArgs>): Promise<Array<Prisma.AIPricingHistoryGetPayload<T>>> {
  return prisma.aIPricingHistory.findMany(args);
}

export async function findCompetitorPrices<
  T extends Prisma.CompetitorPriceFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.CompetitorPriceFindManyArgs>): Promise<Array<Prisma.CompetitorPriceGetPayload<T>>> {
  return prisma.competitorPrice.findMany(args);
}

export async function findInventoryItems<
  T extends Prisma.InventoryItemFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.InventoryItemFindManyArgs>): Promise<Array<Prisma.InventoryItemGetPayload<T>>> {
  return prisma.inventoryItem.findMany(args);
}

export async function findLeads<T extends Prisma.LeadFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.LeadFindManyArgs>,
): Promise<Array<Prisma.LeadGetPayload<T>>> {
  return prisma.lead.findMany(args);
}

export async function findMarketingPerformanceLogs<
  T extends Prisma.MarketingPerformanceLogFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.MarketingPerformanceLogFindManyArgs>): Promise<Array<Prisma.MarketingPerformanceLogGetPayload<T>>> {
  return prisma.marketingPerformanceLog.findMany(args);
}

export async function findDealerKpis<T extends Prisma.DealerKpiFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.DealerKpiFindManyArgs>,
): Promise<Array<Prisma.DealerKpiGetPayload<T>>> {
  return prisma.dealerKpi.findMany(args);
}

export async function findFinanceExpenses<
  T extends Prisma.FinanceExpenseFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.FinanceExpenseFindManyArgs>): Promise<Array<Prisma.FinanceExpenseGetPayload<T>>> {
  return prisma.financeExpense.findMany(args);
}

export async function findRevenueRecords<
  T extends Prisma.RevenueRecordFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.RevenueRecordFindManyArgs>): Promise<Array<Prisma.RevenueRecordGetPayload<T>>> {
  return prisma.revenueRecord.findMany(args);
}

export async function findTickets<T extends Prisma.TicketFindManyArgs>(
  args: Prisma.SelectSubset<T, Prisma.TicketFindManyArgs>,
): Promise<Array<Prisma.TicketGetPayload<T>>> {
  return prisma.ticket.findMany(args);
}

export async function findOperationsTasks<
  T extends Prisma.OperationsTaskFindManyArgs,
>(args: Prisma.SelectSubset<T, Prisma.OperationsTaskFindManyArgs>): Promise<Array<Prisma.OperationsTaskGetPayload<T>>> {
  return prisma.operationsTask.findMany(args);
}
