import { prisma } from "../../core/prisma.js";
import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import type {
  KPIAggSummary,
  KPIInventoryRiskSeries,
  KPILoyaltySeries,
  KPIMarketingSeries,
  KPIOverviewPayload,
  KPIPricingDeltaSeries,
  KPIDemandSeries,
  KPIRevenueSeries,
  KPINarrative,
} from "./ai-brain.types.js";

type DateInput = string | Date | undefined;

function toDate(input: DateInput): Date | undefined {
  if (!input) return undefined;
  const value = input instanceof Date ? input : new Date(input);
  return Number.isNaN(value.getTime()) ? undefined : value;
}

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getPeriod({ periodStart, periodEnd }: { periodStart?: DateInput; periodEnd?: DateInput }) {
  const end = toDate(periodEnd) ?? new Date();
  const start = toDate(periodStart) ?? new Date(end.getTime() - 1000 * 60 * 60 * 24 * 29); // default last 30 days window
  return { start, end };
}

function resolveGrouping(start: Date, end: Date): "day" | "week" | "month" {
  const diffDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
  );
  if (diffDays > 90) return "month";
  if (diffDays > 30) return "week";
  return "day";
}

function labelForDate(date: Date, grouping: "day" | "week" | "month") {
  const d = new Date(date);
  if (grouping === "month")
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  if (grouping === "week") {
    const first = new Date(d);
    first.setDate(d.getDate() - d.getDay());
    return `${first.getFullYear()}-W${String(Math.ceil(first.getDate() / 7)).padStart(2, "0")}`;
  }
  return d.toISOString().slice(0, 10);
}

function sortByLabel<T extends { label: string; _ts?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a._ts ?? 0) - (b._ts ?? 0)).map(({ _ts, ...rest }) => rest);
}

export const aiKpiService = {
  async getOverview(params: {
    brandId?: string;
    scope?: string;
    periodStart?: DateInput;
    periodEnd?: DateInput;
  }): Promise<KPIOverviewPayload> {
    const { brandId, scope } = params;
    const { start, end } = getPeriod(params);
    const grouping = resolveGrouping(start, end);

    const brandFilter = brandId ? { brandId } : {};

    const [
      revenueRecords,
      pricingHistory,
      inventoryItems,
      marketingLogs,
      loyaltyTxs,
      leads,
      deals,
    ] = await prisma.$transaction([
      prisma.revenueRecord.findMany({
        where: { ...brandFilter, createdAt: { gte: start, lte: end } },
        select: { amount: true, currency: true, createdAt: true },
      }),
      prisma.aIPricingHistory.findMany({
        where: { ...brandFilter, createdAt: { gte: start, lte: end } },
        select: { oldNet: true, newNet: true, createdAt: true },
      }),
      prisma.inventoryItem.findMany({ where: { ...brandFilter } }),
      prisma.marketingPerformanceLog.findMany({
        where: { date: { gte: start, lte: end }, campaign: brandId ? { brandId } : undefined },
        select: { impressions: true, clicks: true, conversions: true, date: true },
      }),
      prisma.loyaltyTransaction.findMany({
        where: { ...brandFilter, createdAt: { gte: start, lte: end } },
        select: { pointsChange: true, createdAt: true },
      }),
      prisma.lead.findMany({
        where: { ...brandFilter, createdAt: { gte: start, lte: end } },
        select: { createdAt: true },
      }),
      prisma.deal.findMany({
        where: { ...brandFilter, createdAt: { gte: start, lte: end } },
        select: { status: true, createdAt: true },
      }),
    ]);

    // Revenue aggregation
    const revenueMap = new Map<string, { value: number; currency?: string | null; ts: number }>();
    for (const record of revenueRecords) {
      const label = labelForDate(record.createdAt, grouping);
      const existing = revenueMap.get(label) ?? {
        value: 0,
        currency: record.currency,
        ts: record.createdAt.getTime(),
      };
      revenueMap.set(label, {
        value: existing.value + toNumber(record.amount),
        currency: existing.currency ?? record.currency,
        ts: existing.ts,
      });
    }
    const revenueSeries: KPIRevenueSeries[] = sortByLabel(
      Array.from(revenueMap.entries()).map(([label, { value, currency, ts }]) => ({
        label,
        value,
        currency,
        _ts: ts,
      })),
    );
    const revenueTotal = revenueSeries.reduce((sum, item) => sum + item.value, 0);

    // Pricing deltas
    const pricingSeries: KPIPricingDeltaSeries[] = [];
    for (const change of pricingHistory) {
      const delta = toNumber(change.newNet) - toNumber(change.oldNet);
      pricingSeries.push({
        label: labelForDate(change.createdAt, grouping),
        change: Number(delta.toFixed(2)),
      });
    }
    const pricingDeltaAvg = pricingSeries.length
      ? pricingSeries.reduce((sum, p) => sum + p.change, 0) / pricingSeries.length
      : null;

    // Inventory risk
    let lowStock = 0;
    let stockouts = 0;
    for (const item of inventoryItems) {
      if (item.quantity <= 0) stockouts += 1;
      else if (item.quantity <= 5) lowStock += 1;
    }
    const inventorySeries: KPIInventoryRiskSeries[] = [{ label: "Current", lowStock, stockouts }];

    // Marketing performance
    const marketingMap = new Map<
      string,
      { impressions: number; clicks: number; conversions: number; ts: number }
    >();
    for (const log of marketingLogs) {
      const label = labelForDate(log.date, grouping);
      const existing = marketingMap.get(label) ?? {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ts: log.date.getTime(),
      };
      marketingMap.set(label, {
        ts: existing.ts,
        impressions: existing.impressions + toNumber(log.impressions),
        clicks: existing.clicks + toNumber(log.clicks),
        conversions: existing.conversions + toNumber(log.conversions),
      });
    }
    const marketingSeries: KPIMarketingSeries[] = sortByLabel(
      Array.from(marketingMap.entries()).map(([label, value]) => ({
        label,
        ...value,
        _ts: value.ts,
      })),
    );

    // Loyalty engagement
    const loyaltyMap = new Map<string, { transactions: number; points: number; ts: number }>();
    for (const tx of loyaltyTxs) {
      const label = labelForDate(tx.createdAt, grouping);
      const existing = loyaltyMap.get(label) ?? {
        transactions: 0,
        points: 0,
        ts: tx.createdAt.getTime(),
      };
      loyaltyMap.set(label, {
        ts: existing.ts,
        transactions: existing.transactions + 1,
        points: existing.points + toNumber(tx.pointsChange),
      });
    }
    const loyaltySeries: KPILoyaltySeries[] = sortByLabel(
      Array.from(loyaltyMap.entries()).map(([label, value]) => ({
        label,
        ...value,
        _ts: value.ts,
      })),
    );
    const loyaltyTransactions = loyaltySeries.reduce((sum, item) => sum + item.transactions, 0);
    const loyaltyPointsNet = loyaltySeries.reduce((sum, item) => sum + item.points, 0);

    // Demand / CRM conversions
    const demandMap = new Map<string, { leads: number; deals: number; ts: number }>();
    for (const lead of leads) {
      const label = labelForDate(lead.createdAt, grouping);
      const existing = demandMap.get(label) ?? { leads: 0, deals: 0, ts: lead.createdAt.getTime() };
      demandMap.set(label, { ...existing, leads: existing.leads + 1 });
    }
    for (const deal of deals) {
      const label = labelForDate(deal.createdAt, grouping);
      const existing = demandMap.get(label) ?? { leads: 0, deals: 0, ts: deal.createdAt.getTime() };
      const status = (deal.status ?? "").toString().toLowerCase();
      const isWon = status.includes("won") || status === "closed" || status === "success";
      demandMap.set(label, { ...existing, deals: existing.deals + (isWon ? 1 : 0) });
    }
    const demandSeries: KPIDemandSeries[] = sortByLabel(
      Array.from(demandMap.entries()).map(([label, value]) => ({ label, ...value, _ts: value.ts })),
    );
    const totalLeads = demandSeries.reduce((sum, item) => sum + item.leads, 0);
    const totalDeals = demandSeries.reduce((sum, item) => sum + item.deals, 0);
    const conversionRate = totalLeads ? Number(((totalDeals / totalLeads) * 100).toFixed(2)) : null;

    // Revenue change compared to previous period
    const previousPeriodLength = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - previousPeriodLength);
    const prevRevenue = await prisma.revenueRecord.aggregate({
      _sum: { amount: true },
      where: { brandId, createdAt: { gte: prevStart, lte: prevEnd } },
    });
    const previousRevenueTotal = toNumber(prevRevenue._sum.amount);
    const revenueChange =
      previousRevenueTotal > 0
        ? Number((((revenueTotal - previousRevenueTotal) / previousRevenueTotal) * 100).toFixed(2))
        : null;

    const summary: KPIAggSummary = {
      revenueTotal,
      revenueCurrency: revenueSeries[0]?.currency,
      revenueChange,
      pricingDeltaAvg: pricingDeltaAvg ? Number(pricingDeltaAvg.toFixed(2)) : null,
      lowStock,
      stockouts,
      conversionRate,
      loyaltyTransactions,
      loyaltyPointsNet,
      marketingConversions: marketingSeries.reduce((sum, item) => sum + item.conversions, 0),
    };

    let aiNarrative: KPINarrative | undefined;
    try {
      const aiResponse = await aiOrchestrator.generateKpiNarrativeTyped({
        brandId,
        metrics: {
          ...summary,
          scope,
          periodStart: start.toISOString(),
          periodEnd: end.toISOString(),
        },
      });
      const result = aiResponse?.result as Partial<KPINarrative> | undefined;
      aiNarrative = {
        overview: result?.overview ?? "AI narrative unavailable",
        highlights: result?.highlights ?? [],
        risks: result?.risks ?? [],
        nextSteps: result?.nextSteps ?? [],
        severity: result?.severity ?? "low",
      };
    } catch {
      aiNarrative = {
        overview: "KPI summary generated without AI narrative.",
        highlights: [],
        risks: [],
        nextSteps: [],
        severity: "low",
      };
    }

    return {
      brandId,
      scope,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      revenueSeries,
      pricingSeries,
      inventorySeries,
      marketingSeries,
      loyaltySeries,
      demandSeries,
      summary,
      aiNarrative,
    };
  },
};
