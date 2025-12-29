import { randomUUID } from "crypto";
import {
  findCompetitorPrices,
  findDealerKpis,
  findFinanceExpenses,
  findInventoryItems,
  findLeads,
  findMarketingPerformanceLogs,
  findOperationsTasks,
  findProductPricings,
  findTickets,
  findPricingHistory,
  getRecentProductPricings,
  findRevenueRecords,
} from "../../db/repositories/autonomy.repository.js";
import type { AutonomyDetection, AutonomyIssueType, AutonomySeverity } from "./autonomy.types.js";

function toNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function detection(
  type: AutonomyIssueType,
  severity: AutonomySeverity,
  details: Record<string, unknown>,
  requiredContexts: string[],
): AutonomyDetection {
  return {
    id: randomUUID(),
    type,
    severity,
    detectedAt: new Date().toISOString(),
    details,
    requiredContexts,
  };
}

async function detectPricingAnomalies(): Promise<AutonomyDetection[]> {
  const rows = await getRecentProductPricings();

  const anomalies = rows
    .map((row) => {
      const gross = toNumber(row.b2cGross);
      const dealer = toNumber(row.dealerNet);
      const spread = gross !== undefined && dealer !== undefined ? gross - dealer : undefined;
      return { row, gross, dealer, spread };
    })
    .filter((entry) =>
      entry.gross !== undefined &&
      entry.dealer !== undefined &&
      entry.gross < entry.dealer,
    );

  return anomalies.map(({ row, spread, gross, dealer }) =>
    detection(
      "PRICING_ANOMALY",
      "HIGH",
      {
        productId: row.productId,
        brandId: row.brandId ?? row.product?.brandId,
        b2cGross: gross,
        dealerNet: dealer,
        spread,
      },
      ["product", "pricing", "brand"],
    ),
  );
}

async function detectMarginDrops(): Promise<AutonomyDetection[]> {
  const history = await findPricingHistory({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  const drops = history.filter((entry) => {
    const oldNet = toNumber(entry.oldNet);
    const newNet = toNumber(entry.newNet);
    if (oldNet === undefined || newNet === undefined || oldNet <= 0) return false;
    const delta = (oldNet - newNet) / oldNet;
    return delta >= 0.1;
  });

  return drops.map((entry) =>
    detection(
      "MARGIN_DROP",
      "CRITICAL",
      {
        productId: entry.productId,
        brandId: entry.brandId,
        oldNet: toNumber(entry.oldNet),
        newNet: toNumber(entry.newNet),
        channel: entry.channel,
        aiAgent: entry.aiAgent,
      },
      ["pricing", "product", "brand"],
    ),
  );
}

async function detectCompetitorPressure(): Promise<AutonomyDetection[]> {
  const competitorPrices = await findCompetitorPrices({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  if (!competitorPrices.length) return [];
  const productIds = [...new Set(competitorPrices.map((p) => p.productId))];
  const pricing = await findProductPricings({
    where: { productId: { in: productIds } },
    select: { productId: true, b2cGross: true, dealerNet: true, brandId: true },
  });
  const pricingMap = new Map(pricing.map((p) => [p.productId, p]));

  const flagged = competitorPrices.filter((row) => {
    const base = pricingMap.get(row.productId);
    const competitor = toNumber(row.priceNet ?? row.priceGross);
    const reference = toNumber(base?.b2cGross) ?? toNumber(base?.dealerNet);
    if (competitor === undefined || reference === undefined) return false;
    return competitor < reference * 0.92;
  });

  return flagged.map((row) =>
    detection(
      "COMPETITOR_PRESSURE",
      "HIGH",
      {
        productId: row.productId,
        brandId: row.brandId ?? pricingMap.get(row.productId)?.brandId,
        competitor: row.competitor,
        price: toNumber(row.priceNet ?? row.priceGross),
        reference: toNumber(pricingMap.get(row.productId)?.b2cGross ?? pricingMap.get(row.productId)?.dealerNet),
        country: row.country,
      },
      ["product", "pricing", "brand"],
    ),
  );
}

async function detectInventoryRisk(): Promise<AutonomyDetection[]> {
  const lowStock = await findInventoryItems({
    where: { quantity: { lte: 5 } },
    orderBy: { quantity: "asc" },
    take: 25,
    include: { product: { select: { id: true, name: true, brandId: true, sku: true } }, brand: true },
  });

  return lowStock.map((item) =>
    detection(
      "INVENTORY_RISK",
      item.quantity <= 1 ? "CRITICAL" : "HIGH",
      {
        productId: item.productId,
        brandId: item.brandId ?? item.product?.brandId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        sku: item.product?.sku,
      },
      ["inventory", "product", "brand"],
    ),
  );
}

async function detectCrmChurn(): Promise<AutonomyDetection[]> {
  const leads = await findLeads({
    where: { score: { lte: 35 } },
    orderBy: { score: "asc" },
    take: 20,
    select: { id: true, brandId: true, score: true, status: true, stageId: true },
  });

  return leads.map((lead) =>
    detection(
      "CRM_CHURN_RISK",
      lead.score !== null && lead.score !== undefined && lead.score <= 15 ? "CRITICAL" : "HIGH",
      { leadId: lead.id, brandId: lead.brandId, score: lead.score, status: lead.status, stageId: lead.stageId },
      ["crm-client", "brand"],
    ),
  );
}

async function detectMarketingUnderperformance(): Promise<AutonomyDetection[]> {
  const logs = await findMarketingPerformanceLogs({
    orderBy: { date: "desc" },
    take: 25,
    include: { campaign: { select: { id: true, name: true, brandId: true, status: true } } },
  });

  const weak = logs.filter((row) => {
    const spend = toNumber(row.spend);
    const conversions = row.conversions ?? 0;
    const impressions = row.impressions ?? 0;
    if (spend === undefined || spend <= 0) return false;
    const ctr = impressions ? conversions / impressions : 0;
    return conversions <= 1 || ctr < 0.0005;
  });

  return weak.map((row) =>
    detection(
      "MARKETING_UNDERPERFORMANCE",
      "MEDIUM",
      {
        campaignId: row.campaignId,
        campaign: row.campaign?.name,
        brandId: row.campaign?.brandId,
        spend: toNumber(row.spend),
        conversions: row.conversions,
        impressions: row.impressions,
      },
      ["marketing", "brand"],
    ),
  );
}

async function detectPartnerRisk(): Promise<AutonomyDetection[]> {
  const kpis = await findDealerKpis({
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { partner: { select: { id: true, name: true, brandId: true, status: true, tierId: true } } },
  });

  const risky = kpis.filter((kpi) => (kpi.engagementScore ?? 1) < 0.5 || (kpi.lastOrderAt ? kpi.lastOrderAt < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : false));

  return risky.map((kpi) =>
    detection(
      "PARTNER_RISK",
      "HIGH",
      {
        partnerId: kpi.partnerId,
        brandId: kpi.brandId,
        engagementScore: kpi.engagementScore,
        lastOrderAt: kpi.lastOrderAt,
        status: kpi.partner?.status,
        tierId: kpi.partner?.tierId,
      },
      ["partner", "brand"],
    ),
  );
}

async function detectFinanceRisk(): Promise<AutonomyDetection[]> {
  const expenses = await findFinanceExpenses({ orderBy: { incurredAt: "desc" }, take: 25 });
  const revenues = await findRevenueRecords({ orderBy: { periodEnd: "desc" }, take: 25 });

  const totalExpenses = expenses.reduce((sum, e) => sum + (toNumber(e.amount) ?? 0), 0);
  const totalRevenue = revenues.reduce((sum, r) => sum + (toNumber(r.amount) ?? 0), 0);

  if (!totalExpenses && !totalRevenue) return [];

  const severity: AutonomySeverity = totalRevenue <= 0 || totalExpenses > totalRevenue * 1.1 ? "CRITICAL" : "HIGH";

  return [
    detection(
      "FINANCE_RISK",
      severity,
      { totalExpenses, totalRevenue, expenseCount: expenses.length, revenueCount: revenues.length },
      ["finance", "brand"],
    ),
  ];
}

async function detectOperationalAlerts(): Promise<AutonomyDetection[]> {
  const urgentTickets = await findTickets({
    where: {
      OR: [
        { priority: { in: ["HIGH", "URGENT"] } },
        { status: { in: ["ESCALATED", "BLOCKED"] } },
      ],
      status: { notIn: ["RESOLVED", "CLOSED"] },
    },
    orderBy: { updatedAt: "desc" },
    take: 15,
    select: { id: true, brandId: true, status: true, priority: true, category: true, updatedAt: true },
  });

  const overdueOps = await findOperationsTasks({
    where: { status: { notIn: ["done", "completed", "RESOLVED"] }, dueDate: { lt: new Date() } },
    orderBy: { dueDate: "asc" },
    take: 10,
    select: { id: true, brandId: true, title: true, dueDate: true, status: true },
  });

  const tickets = urgentTickets.map((t) =>
    detection(
      "SUPPORT_ALERT",
      "HIGH",
      { ticketId: t.id, brandId: t.brandId, status: t.status, priority: t.priority, category: t.category, updatedAt: t.updatedAt },
      ["support", "brand"],
    ),
  );

  const ops = overdueOps.map((t) =>
    detection(
      "OPERATIONS_ALERT",
      "MEDIUM",
      { taskId: t.id, brandId: t.brandId, title: t.title, dueDate: t.dueDate, status: t.status },
      ["operations", "brand"],
    ),
  );

  return [...tickets, ...ops];
}

const DETECTORS: Array<() => Promise<AutonomyDetection[]>> = [
  detectPricingAnomalies,
  detectMarginDrops,
  detectCompetitorPressure,
  detectInventoryRisk,
  detectCrmChurn,
  detectMarketingUnderperformance,
  detectPartnerRisk,
  detectFinanceRisk,
  detectOperationalAlerts,
];

export async function runAutonomyDetectors(): Promise<AutonomyDetection[]> {
  const settled = await Promise.allSettled(DETECTORS.map((fn) => fn()));
  const detections: AutonomyDetection[] = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") {
      detections.push(...result.value);
    } else {
      detections.push(
        detection(
          "OPERATIONS_ALERT",
          "LOW",
          { detector: index, error: (result.reason as Error)?.message ?? "detector_failed" },
          ["operations"],
        ),
      );
    }
  });

  return detections;
}
