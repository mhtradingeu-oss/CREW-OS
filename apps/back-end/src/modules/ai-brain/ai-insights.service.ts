import { prisma } from "../../core/prisma.js";
import { aiOrchestrator } from "../../core/ai/orchestrator.js";
import { notFound } from "../../core/http/errors.js";
import { aiKpiService } from "./ai-kpi.service.js";
import type { KPIOverviewPayload } from "./ai-brain.types.js";

function formatInsightDetails(scope: string, payload: unknown) {
  if (!payload) return `${scope} insight generated with no details.`;
  if (typeof payload === "string") return payload;
  try {
    return `**${scope.toUpperCase()} Insight**\n\n\`\`\`json\n${JSON.stringify(payload, null, 2)}\n\`\`\``;
  } catch {
    return `${scope} insight generated.`;
  }
}

type InsightResult = {
  summary?: string;
  [key: string]: unknown;
};

function extractResult<T>(response: { result?: T } | T | null | undefined): T | undefined {
  if (response && typeof response === "object" && "result" in response) {
    return (response as { result?: T }).result;
  }
  return response === undefined ? undefined : (response as T);
}

export const aiInsightsService = {
  async refresh(payload: { brandId?: string; scope?: string }) {
    const baseData = {
      brandId: payload.brandId,
      summary: "Insight generated",
      details: "",
    };

    const pricing = extractResult<InsightResult>(
      await aiOrchestrator.generatePricingInsight({
        brandId: payload.brandId,
        scope: payload.scope,
      }),
    );
    const crm = extractResult<InsightResult>(
      await aiOrchestrator.generateCRMInsight({
        brandId: payload.brandId,
        scope: payload.scope,
      }),
    );
    const marketing = extractResult<InsightResult>(
      await aiOrchestrator.generateMarketingInsight({
        brandId: payload.brandId,
        scope: payload.scope,
      }),
    );
    const inventory = extractResult<InsightResult>(
      await aiOrchestrator.generateInventoryInsight({
        brandId: payload.brandId,
        scope: payload.scope,
      }),
    );
    const loyalty = extractResult<InsightResult>(
      await aiOrchestrator.generateLoyaltyInsight({
        brandId: payload.brandId,
        scope: payload.scope,
      }),
    );

    const insights = [
      {
        ...baseData,
        os: "pricing",
        summary: pricing?.summary ?? "Pricing insight",
        details: formatInsightDetails("pricing", pricing),
      },
      {
        ...baseData,
        os: "crm",
        summary: crm?.summary ?? "CRM insight",
        details: formatInsightDetails("crm", crm),
      },
      {
        ...baseData,
        os: "marketing",
        summary: marketing?.summary ?? "Marketing insight",
        details: formatInsightDetails("marketing", marketing),
      },
      {
        ...baseData,
        os: "inventory",
        summary: inventory?.summary ?? "Inventory insight",
        details: formatInsightDetails("inventory", inventory),
      },
      {
        ...baseData,
        os: "loyalty",
        summary: loyalty?.summary ?? "Loyalty insight",
        details: formatInsightDetails("loyalty", loyalty),
      },
    ];

    return prisma.$transaction(
      insights.map((insight) => prisma.aIInsight.create({ data: insight })),
    );
  },
  async list(filters: {
    brandId?: string;
    domain?: string;
    scope?: string;
    agentId?: string;
    severity?: string;
    limit?: number;
    offset?: number;
    periodStart?: Date;
    periodEnd?: Date;
    sortOrder?: "asc" | "desc";
  }) {
    const items = await prisma.aIInsight.findMany({
      where: {
        brandId: filters.brandId,
        os: filters.domain ?? filters.scope,
        createdAt: { gte: filters.periodStart, lte: filters.periodEnd },
      },
      orderBy: { createdAt: filters.sortOrder ?? "desc" },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    });

    if (!filters.agentId && !filters.severity) return items;

    const normalizedSeverity = filters.severity?.toLowerCase();

    return items.filter((item) => {
      let parsedDetails: unknown;
      if (item.details) {
        try {
          parsedDetails = JSON.parse(item.details);
        } catch {
          parsedDetails = item.details;
        }
      }

      const detailsAgentId =
        typeof parsedDetails === "object" && parsedDetails && "agentId" in parsedDetails
          ? (parsedDetails as { agentId?: string }).agentId
          : undefined;

      const detailsSeverity =
        typeof parsedDetails === "object" && parsedDetails && "severity" in parsedDetails
          ? (parsedDetails as { severity?: string }).severity
          : undefined;

      const agentOk = filters.agentId ? detailsAgentId === filters.agentId || item.entityId === filters.agentId : true;
      const severityOk = normalizedSeverity
        ? detailsSeverity?.toLowerCase() === normalizedSeverity
        : true;

      return agentOk && severityOk;
    });
  },
  async get(id: string) {
    const record = await prisma.aIInsight.findUnique({ where: { id } });
    if (!record) throw notFound("Insight not found");
    return record;
  },
  async createReport(payload: {
    brandId?: string;
    title: string;
    scope?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }) {
    const report = await aiOrchestrator.generateFullBrandReport({
      brandId: payload.brandId,
      scope: payload.scope,
    });
    return prisma.aIReport.create({
      data: {
        brandId: payload.brandId,
        title: payload.title,
        scope: payload.scope,
        periodStart: payload.periodStart,
        periodEnd: payload.periodEnd,
        content: JSON.stringify(report.result ?? report),
      },
    });
  },
  async listReports(filters: {
    brandId?: string;
    scope?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }) {
    return prisma.aIReport.findMany({
      where: {
        brandId: filters.brandId,
        scope: filters.scope,
        createdAt: { gte: filters.periodStart, lte: filters.periodEnd },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },
  async getReport(id: string) {
    const report = await prisma.aIReport.findUnique({ where: { id } });
    if (!report) throw notFound("Report not found");
    return report;
  },

  renderReport(report: {
    id: string;
    title: string;
    scope: string | null;
    brandId: string | null;
    content: string | null;
    createdAt: Date;
    periodStart: Date | null;
    periodEnd: Date | null;
  }) {
    const contentMarkdown = report.content ?? "";
    const contentHtmlSafe = contentMarkdown ? contentMarkdown.replace(/\n/g, "<br/>") : null;
    return {
      id: report.id,
      title: report.title,
      brandId: report.brandId,
      scope: report.scope,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      createdAt: report.createdAt,
      contentMarkdown,
      contentHtmlSafe,
    };
  },

  async getReportRendered(id: string) {
    const report = await this.getReport(id);
    return this.renderReport(report);
  },

  async kpiSummary(filters: {
    brandId?: string;
    scope?: string;
    periodStart?: Date;
    periodEnd?: Date;
  }): Promise<KPIOverviewPayload> {
    return aiKpiService.getOverview(filters);
  },
};
