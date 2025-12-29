import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { logger } from "../../core/logger.js";
import { runAIRequest } from "../../core/ai-service/ai-client.js";
import { makeCacheKey } from "../../core/ai/orchestrator.js";
import { autonomyService } from "../../core/ai/autonomy/autonomy.service.js";
import { getSafetyEvents, getTokenUsage } from "../ai-monitoring/ai-monitoring.service.js";
import type {
  AIRestrictionRecord,
  AdminAISummaryInput,
  AdminAISummaryResult,
  AuditLogRecord,
  CreateAIRestrictionInput,
  CreatePolicyInput,
  PolicyRecord,
  UpdateAIRestrictionInput,
  UpdatePolicyInput,
} from "./admin.types.js";

const policySelect = {
  id: true,
  name: true,
  rulesJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.PolicySelect;

const aiRestrictionSelect = {
  id: true,
  name: true,
  rulesJson: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIRestrictionPolicySelect;

const aiInsightSelect = {
  id: true,
  summary: true,
  details: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AIInsightSelect;

const logSelect = {
  id: true,
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

class AdminService {
  constructor(private readonly db = prisma) {}

  async listPolicies(params: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search } = params;
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.PolicyWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    const [total, rows] = await this.db.$transaction([
      this.db.policy.count({ where }),
      this.db.policy.findMany({
        where,
        select: policySelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    return {
      items: rows.map((row) => this.mapPolicy(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async getPolicy(id: string) {
    const record = await this.db.policy.findUnique({ where: { id }, select: policySelect });
    if (!record) throw notFound("Policy not found");
    return this.mapPolicy(record);
  }

  async createPolicy(input: CreatePolicyInput) {
    if (!input.name) throw badRequest("Policy name is required");
    const created = await this.db.policy.create({
      data: {
        name: input.name,
        rulesJson: input.rulesJson ?? null,
      },
      select: policySelect,
    });
    return this.mapPolicy(created);
  }

  async updatePolicy(id: string, input: UpdatePolicyInput) {
    const existing = await this.db.policy.findUnique({ where: { id }, select: policySelect });
    if (!existing) throw notFound("Policy not found");
    const updated = await this.db.policy.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        rulesJson: input.rulesJson ?? existing.rulesJson,
      },
      select: policySelect,
    });
    return this.mapPolicy(updated);
  }

  async deletePolicy(id: string) {
    const existing = await this.db.policy.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw notFound("Policy not found");
    await this.db.policy.delete({ where: { id } });
    return { id };
  }

  async listAIRestrictions(params: { search?: string; page?: number; pageSize?: number } = {}) {
    const { search } = params;
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.AIRestrictionPolicyWhereInput = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    const [total, rows] = await this.db.$transaction([
      this.db.aIRestrictionPolicy.count({ where }),
      this.db.aIRestrictionPolicy.findMany({
        where,
        select: aiRestrictionSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    return {
      items: rows.map((row) => this.mapAIRestriction(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async getAIRestriction(id: string) {
    const record = await this.db.aIRestrictionPolicy.findUnique({
      where: { id },
      select: aiRestrictionSelect,
    });
    if (!record) throw notFound("AI restriction not found");
    return this.mapAIRestriction(record);
  }

  async createAIRestriction(input: CreateAIRestrictionInput) {
    if (!input.name) throw badRequest("Restriction name is required");
    const created = await this.db.aIRestrictionPolicy.create({
      data: { name: input.name, rulesJson: input.rulesJson ?? null },
      select: aiRestrictionSelect,
    });
    return this.mapAIRestriction(created);
  }

  async updateAIRestriction(id: string, input: UpdateAIRestrictionInput) {
    const existing = await this.db.aIRestrictionPolicy.findUnique({
      where: { id },
      select: aiRestrictionSelect,
    });
    if (!existing) throw notFound("AI restriction not found");
    const updated = await this.db.aIRestrictionPolicy.update({
      where: { id },
      data: {
        name: input.name ?? existing.name,
        rulesJson: input.rulesJson ?? existing.rulesJson,
      },
      select: aiRestrictionSelect,
    });
    return this.mapAIRestriction(updated);
  }

  async deleteAIRestriction(id: string) {
    const existing = await this.db.aIRestrictionPolicy.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) throw notFound("AI restriction not found");
    await this.db.aIRestrictionPolicy.delete({ where: { id } });
    return { id };
  }

  async listAuditLogs(params: {
    action?: string;
    entityType?: string;
    page?: number;
    pageSize?: number;
  } = {}) {
    const { action, entityType } = params;
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(params.pageSize ?? 20, 100);
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.AuditLogWhereInput = {};
    if (action) where.action = { contains: action, mode: "insensitive" };
    if (entityType) where.entityType = entityType;
    const [total, rows] = await this.db.$transaction([
      this.db.auditLog.count({ where }),
      this.db.auditLog.findMany({
        where,
        select: logSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);
    return {
      items: rows.map((row) => this.mapAuditLog(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async summarizeAI(payload: AdminAISummaryInput): Promise<AdminAISummaryResult> {
    const prompt = this.buildAiPrompt(payload);
    const cacheKey = makeCacheKey("admin-audit", {
      ...payload,
      brandId: payload.brandId,
      tenantId: payload.tenantId,
    });
    const response = await runAIRequest({
      model: process.env.AI_MODEL_MHOS ?? "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are the MH-OS admin auditor. Provide concise summaries and detailed reasoning for audit findings.",
        },
        { role: "user", content: prompt },
      ],
    });
    const details =
      response.success && response.content
        ? response.content.trim()
        : "AI audit summary could not be generated.";
    const summary = this.extractSummary(details);
    const insight = await this.db.aIInsight.create({
      data: {
        brandId: payload.brandId,
        os: "admin",
        entityType: payload.entityType ?? "policy",
        entityId: payload.entityId ?? null,
        summary,
        details,
      },
      select: aiInsightSelect,
    });
    logger.info(`[admin] AI audit summary stored as ${insight.id}`);
    return {
      id: insight.id,
      summary: insight.summary ?? summary,
      details: insight.details ?? details,
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  }

  private mapPolicy(record: Prisma.PolicyGetPayload<{ select: typeof policySelect }>): PolicyRecord {
    return {
      id: record.id,
      name: record.name,
      rulesJson: record.rulesJson ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapAIRestriction(
    record: Prisma.AIRestrictionPolicyGetPayload<{ select: typeof aiRestrictionSelect }>,
  ): AIRestrictionRecord {
    return {
      id: record.id,
      name: record.name,
      rulesJson: record.rulesJson ?? null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapAuditLog(record: Prisma.AuditLogGetPayload<{ select: typeof logSelect }>): AuditLogRecord {
    return {
      id: record.id,
      userId: record.userId ?? null,
      action: record.action,
      entityType: record.entityType ?? null,
      entityId: record.entityId ?? null,
      metadata: record.metadata ?? null,
      createdAt: record.createdAt,
    };
  }

  private buildAiPrompt(payload: AdminAISummaryInput) {
    const lines = [
      `Brand: ${payload.brandId}`,
      `Entity Type: ${payload.entityType}`,
      `Entity ID: ${payload.entityId ?? "unspecified"}`,
      `Context: ${payload.context ?? "None"}`,
      "Summarize the key audit highlights, risks, and next actions.",
    ];
    return lines.join("\n");
  }

  private extractSummary(details: string) {
    const trimmed = details.trim();
    if (!trimmed) return "Admin audit summary";
    const [firstLine = ""] = trimmed.split("\n");
    return firstLine.replace(/^summary:\s*/i, "").trim() || trimmed;
  }

  async getAITelemetry(params: { brandId?: string | null; tenantId?: string | null }) {
    const [safetyEvents, tokenUsage, costTotals, budgets] = await Promise.all([
      getSafetyEvents(50),
      getTokenUsage(),
      this.db.aIExecutionLog.aggregate({ _sum: { costUsd: true, totalTokens: true } }),
      this.db.aIAgentBudget.findMany({ where: { active: true } }),
    ]);

    const autonomy = autonomyService.getStatus();
    const pending = autonomy.pendingApproval ?? [];
    const backlog = {
      total: pending.length,
      high: pending.filter((t) => t.risk === "HIGH" || t.risk === "CRITICAL").length,
      sample: pending.slice(0, 10).map((t) => ({ taskId: t.taskId, agentId: t.agentId, risk: t.risk })),
    };

    const budgetTelemetry = budgets.map((b) => ({
      agentName: b.agentName,
      brandId: b.brandId,
      tenantId: b.tenantId,
      dailyBudgetUsd: b.dailyBudgetUsd,
      monthlyBudgetUsd: b.monthlyBudgetUsd,
      tokenLimit: b.tokenLimit,
      alertThreshold: b.alertThreshold,
    }));

    return {
      safetyEvents,
      tokenUsage,
      costTotals: {
        totalTokens: costTotals._sum.totalTokens ?? 0,
        costUsd: costTotals._sum.costUsd ?? 0,
      },
      autonomy: {
        backlog,
        lastRunAt: autonomy.lastRunAt,
      },
      budgets: budgetTelemetry,
    };
  }
}

export const adminService = new AdminService();
