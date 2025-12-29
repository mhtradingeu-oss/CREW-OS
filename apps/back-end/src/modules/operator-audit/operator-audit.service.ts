import { Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { env } from "../../core/config/env.js";
import { notFound } from "../../core/http/errors.js";
import { AutomationGovernanceRepository } from "../../core/db/repositories/automation-governance.repository.js";
import { prisma } from "../../core/prisma.js";
import type {
  ApprovalDetail,
  ApprovalTimelineItem,
  ExecutionDetail,
  ExecutionTimelineItem,
  IncidentTimelineItem,
  KillSwitchRecord,
  KillSwitchSummary,
  PaginatedTimeline,
  RollbackTimelineItem,
  SnapshotTimelineItem,
  SuggestionTimelineItem,
} from "./operator-audit.types.js";

const DEFAULT_ENVIRONMENT = env.NODE_ENV ?? "development";

type TimelineFilters = {
  brandId?: string;
  status?: string;
  actor?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
};

async function loadBrands(brandIds: string[]) {
  if (!brandIds.length) {
    return new Map<string, { id: string; name?: string; tenantId?: string }>();
  }
  const brands = await prisma.brand.findMany({
    where: { id: { in: brandIds } },
    select: { id: true, name: true, tenantId: true },
  });
  return new Map(brands.map((brand) => [brand.id, brand]));
}

async function loadUsers(userIds: string[]) {
  if (!userIds.length) return new Map<string, { id: string; email?: string }>();
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  return new Map(users.map((user) => [user.id, user]));
}

function hashInput(sn: string | null | undefined) {
  if (!sn) return null;
  return createHash("sha256").update(sn).digest("hex");
}

function buildPaginatedResponse<T>(items: T[], total: number, filters: TimelineFilters): PaginatedTimeline<T> {
  return {
    items,
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export const operatorAuditService = {
  async listSnapshots(filters: TimelineFilters): Promise<PaginatedTimeline<SnapshotTimelineItem>> {
    const where: Prisma.AILearningJournalWhereInput = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.status) where.eventType = filters.status;
    if (filters.actor) {
      where.source = { contains: filters.actor, mode: "insensitive" };
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [total, records] = await Promise.all([
      prisma.aILearningJournal.count({ where }),
      prisma.aILearningJournal.findMany({
        where,
        include: { brand: { select: { id: true, name: true, tenantId: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const items: SnapshotTimelineItem[] = records.map((record) => ({
      id: record.id,
      timestamp: record.createdAt,
      brand: record.brand
        ? { id: record.brand.id, name: record.brand.name ?? undefined, tenantId: record.brand.tenantId ?? undefined }
        : undefined,
      tenantId: record.brand?.tenantId ?? undefined,
      actor: record.source ?? "system",
      actorType: "system",
      status: record.eventType ?? "snapshot",
      environment: DEFAULT_ENVIRONMENT,
      snapshotHash: null,
      eventType: record.eventType ?? undefined,
      productId: record.productId ?? undefined,
      source: record.source ?? undefined,
    }));

    return buildPaginatedResponse(items, total, filters);
  },

  async listSuggestions(filters: TimelineFilters): Promise<PaginatedTimeline<SuggestionTimelineItem>> {
    const where: Prisma.AISuggestionWhereInput = {};
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.status) where.status = filters.status;
    if (filters.actor) {
      where.OR = [
        { agent: { contains: filters.actor, mode: "insensitive" } },
        { approvedByUserId: filters.actor },
      ];
    }
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [total, records] = await Promise.all([
      prisma.aISuggestion.count({ where }),
      prisma.aISuggestion.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const brandIds = Array.from(new Set(records.map((record) => record.brandId)));
    const brandMap = await loadBrands(brandIds);

    const items: SuggestionTimelineItem[] = records.map((record) => ({
      id: record.id,
      timestamp: record.createdAt,
      brand: brandMap.get(record.brandId)
        ? { ...brandMap.get(record.brandId) }
        : { id: record.brandId },
      tenantId: record.tenantId ?? brandMap.get(record.brandId)?.tenantId,
      actor: record.agent,
      actorType: "system",
      status: record.status,
      environment: DEFAULT_ENVIRONMENT,
      snapshotHash: hashInput(record.inputSnapshotJson),
      suggestionType: record.suggestionType,
      riskLevel: record.riskLevel,
      correlationId: record.correlationId ?? undefined,
    }));

    return buildPaginatedResponse(items, total, filters);
  },

  async listApprovals(filters: TimelineFilters): Promise<PaginatedTimeline<ApprovalTimelineItem>> {
    const where: Prisma.AutomationApprovalDecisionWhereInput = {};
    if (filters.status) {
      const normalized = filters.status.trim().toUpperCase();
      if (normalized) {
        where.status = normalized as Prisma.AutomationApprovalDecisionWhereInput["status"];
      }
    }
    if (filters.brandId) {
      where.suggestion = { brandId: filters.brandId };
    }
    if (filters.actor) where.approvedById = filters.actor;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    const [total, records] = await Promise.all([
      prisma.automationApprovalDecision.count({ where }),
      prisma.automationApprovalDecision.findMany({
        where,
        include: {
          suggestion: { select: { brandId: true, correlationId: true } },
        },
        orderBy: [{ approvedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const brandIds = Array.from(new Set(records.map((record) => record.suggestion?.brandId).filter(Boolean) as string[]));
    const brandMap = await loadBrands(brandIds);
    const actorIds = Array.from(new Set(records.map((record) => record.approvedById).filter(Boolean) as string[]));
    const userMap = await loadUsers(actorIds);

    const items: ApprovalTimelineItem[] = records.map((record) => {
      const brandId = record.suggestion?.brandId;
      const brand = brandId ? brandMap.get(brandId) : undefined;
      const actor = record.approvedById ? userMap.get(record.approvedById) : undefined;
      return {
        id: record.id,
        timestamp: record.approvedAt ?? record.createdAt,
        brand: brand ? { ...brand } : undefined,
        tenantId: brand?.tenantId,
        actor: actor?.email ?? record.approvedById ?? "system",
        actorType: record.approvedById ? "user" : "system",
        status: record.status,
        environment: DEFAULT_ENVIRONMENT,
        snapshotHash: record.snapshotHash,
        suggestionId: record.suggestionId,
        correlationId: record.suggestion?.correlationId ?? undefined,
        approvedById: record.approvedById,
      };
    });

    return buildPaginatedResponse(items, total, filters);
  },

  async listExecutions(filters: TimelineFilters): Promise<PaginatedTimeline<ExecutionTimelineItem>> {
    const where: Prisma.AutomationExecutionLedgerWhereInput = {};
    if (filters.status) {
      const normalized = filters.status.trim().toUpperCase();
      if (normalized) {
        where.result = normalized as Prisma.AutomationExecutionLedgerWhereInput["result"];
      }
    }
    if (filters.actor) {
      where.OR = [
        { executedById: filters.actor },
        { executedBy: { email: { contains: filters.actor, mode: "insensitive" } } },
      ];
    }
    if (filters.from || filters.to) {
      where.executedAt = {};
      if (filters.from) where.executedAt.gte = filters.from;
      if (filters.to) where.executedAt.lte = filters.to;
    }
    if (filters.brandId) {
      where.approvalDecision = { suggestion: { brandId: filters.brandId } };
    }

    const [total, records] = await Promise.all([
      prisma.automationExecutionLedger.count({ where }),
      prisma.automationExecutionLedger.findMany({
        where,
        include: {
          executedBy: { select: { id: true, email: true } },
          approvalDecision: {
            select: {
              id: true,
              status: true,
              snapshotHash: true,
              environment: true,
              suggestion: { select: { brandId: true, correlationId: true } },
            },
          },
        },
        orderBy: [{ executedAt: "desc" }, { id: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const brandIds = Array.from(
      new Set(
        records
          .map((record) => record.approvalDecision?.suggestion?.brandId)
          .filter(Boolean) as string[],
      ),
    );
    const brandMap = await loadBrands(brandIds);

    const items: ExecutionTimelineItem[] = records.map((record) => {
      const approval = record.approvalDecision;
      const brandId = approval?.suggestion?.brandId;
      return {
        id: record.id,
        timestamp: record.executedAt,
        brand: brandId ? brandMap.get(brandId) : undefined,
        tenantId: brandId ? brandMap.get(brandId)?.tenantId : undefined,
        actor: record.executedBy.email ?? record.executedBy.id,
        actorType: "user",
        status: record.result,
        environment: record.environment,
        snapshotHash: record.snapshotHash,
        executionId: record.id,
        approvalDecisionId: record.approvalDecisionId,
        result: record.result,
        actionType: record.actionType,
        executedById: record.executedById,
        correlationId: approval?.suggestion?.correlationId ?? undefined,
      };
    });

    return buildPaginatedResponse(items, total, filters);
  },

  async listIncidents(filters: TimelineFilters): Promise<PaginatedTimeline<IncidentTimelineItem>> {
    const where: Prisma.AutomationIncidentWhereInput = {};
    if (filters.status) {
      const normalized = filters.status.trim().toUpperCase();
      if (normalized) {
        where.status = normalized as Prisma.AutomationIncidentWhereInput["status"];
      }
    }
    const andConditions: Prisma.AutomationIncidentWhereInput[] = [];
    if (filters.actor) {
      andConditions.push({
        OR: [
          { detectedById: filters.actor },
          { detectedBy: { contains: filters.actor, mode: "insensitive" } },
        ],
      });
    }
    if (filters.brandId) {
      andConditions.push({
        OR: [
          { relatedExecution: { approvalDecision: { suggestion: { brandId: filters.brandId } } } },
          { relatedApprovalDecision: { suggestion: { brandId: filters.brandId } } },
        ],
      });
    }
    if (andConditions.length) {
      where.AND = andConditions;
    }
    if (filters.from || filters.to) {
      where.detectedAt = {};
      if (filters.from) where.detectedAt.gte = filters.from;
      if (filters.to) where.detectedAt.lte = filters.to;
    }

    const [total, records] = await Promise.all([
      prisma.automationIncident.count({ where }),
      prisma.automationIncident.findMany({
        where,
        include: {
          relatedExecution: {
            select: {
              id: true,
              snapshotHash: true,
              environment: true,
              approvalDecision: {
                select: { id: true, suggestion: { select: { brandId: true, correlationId: true } } },
              },
            },
          },
          relatedApprovalDecision: {
            select: { id: true, suggestion: { select: { brandId: true, correlationId: true } }, snapshotHash: true },
          },
        },
        orderBy: [{ detectedAt: "desc" }, { incidentId: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const brandIds = Array.from(
      new Set(
        records
          .map((record) =>
            record.relatedExecution?.approvalDecision?.suggestion?.brandId ?? record.relatedApprovalDecision?.suggestion?.brandId,
          )
          .filter(Boolean) as string[],
      ),
    );
    const brandMap = await loadBrands(brandIds);

    const items: IncidentTimelineItem[] = records.map((record) => {
      const execBrandId = record.relatedExecution?.approvalDecision?.suggestion?.brandId;
      const altBrandId = record.relatedApprovalDecision?.suggestion?.brandId;
      const brandId = execBrandId ?? altBrandId;
      const brand = brandId ? brandMap.get(brandId) : undefined;
      const executionId = record.relatedExecution?.id ?? undefined;
      const snapshotHash = record.relatedExecution?.snapshotHash ?? record.relatedApprovalDecision?.snapshotHash;
      const correlationId =
        record.relatedExecution?.approvalDecision?.suggestion?.correlationId ?? record.relatedApprovalDecision?.suggestion?.correlationId;

      return {
        id: record.incidentId,
        timestamp: record.detectedAt,
        brand: brand ? { ...brand } : undefined,
        tenantId: brand?.tenantId,
        actor: record.detectedById ?? record.detectedBy ?? "system",
        actorType: record.detectedById ? "user" : "system",
        status: record.status,
        environment: record.relatedExecution?.environment ?? DEFAULT_ENVIRONMENT,
        snapshotHash: snapshotHash ?? null,
        incidentId: record.incidentId,
        incidentType: record.type,
        severity: record.severity,
        detectedBy: record.detectedBy,
        detectedById: record.detectedById ?? undefined,
        description: record.description ?? undefined,
        incidentStatus: record.status,
        correlationId,
        executionId,
      };
    });

    return buildPaginatedResponse(items, total, filters);
  },

  async listRollbacks(filters: TimelineFilters): Promise<PaginatedTimeline<RollbackTimelineItem>> {
    const where: Prisma.AutomationRollbackExecutionLedgerWhereInput = {};
    if (filters.status) {
      const normalized = filters.status.trim().toUpperCase();
      if (normalized) {
        where.status = normalized as Prisma.AutomationRollbackExecutionLedgerWhereInput["status"];
      }
    }
    if (filters.actor) where.approvedById = filters.actor;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }
    if (filters.brandId) {
      where.execution = { approvalDecision: { suggestion: { brandId: filters.brandId } } };
    }

    const [total, records] = await Promise.all([
      prisma.automationRollbackExecutionLedger.count({ where }),
      prisma.automationRollbackExecutionLedger.findMany({
        where,
        include: {
          execution: {
            select: {
              id: true,
              snapshotHash: true,
              environment: true,
              approvalDecision: {
                select: { id: true, suggestion: { select: { brandId: true, correlationId: true } } },
              },
            },
          },
        },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]);

    const brandIds = Array.from(
      new Set(
        records
          .map((record) => record.execution?.approvalDecision?.suggestion?.brandId)
          .filter(Boolean) as string[],
      ),
    );
    const brandMap = await loadBrands(brandIds);

    const items: RollbackTimelineItem[] = records.map((record) => {
      const brandId = record.execution?.approvalDecision?.suggestion?.brandId;
      const brand = brandId ? brandMap.get(brandId) : undefined;
      return {
        id: record.id,
        timestamp: record.createdAt,
        brand: brand ? { ...brand } : undefined,
        tenantId: brand?.tenantId,
        actor: record.approvedById,
        actorType: "user",
        status: record.status,
        environment: record.execution?.environment ?? DEFAULT_ENVIRONMENT,
        snapshotHash: record.execution?.snapshotHash ?? null,
        rollbackId: record.id,
        executionId: record.executionId,
        incidentId: record.incidentId,
        reason: record.reason,
        snapshotReference: record.snapshotReference,
        scopeDescription: record.scopeDescription,
      };
    });

    return buildPaginatedResponse(items, total, filters);
  },

  async getApprovalDetail(id: string): Promise<ApprovalDetail> {
    const approval = await prisma.automationApprovalDecision.findUnique({
      where: { id },
      include: { suggestion: { select: { brandId: true, correlationId: true } } },
    });
    if (!approval) {
      throw notFound("Approval decision not found");
    }
    const brand =
      approval.suggestion?.brandId
        ? await prisma.brand.findUnique({ where: { id: approval.suggestion.brandId }, select: { id: true, name: true, tenantId: true } })
        : null;
    const user = approval.approvedById
      ? await prisma.user.findUnique({ where: { id: approval.approvedById }, select: { id: true, email: true } })
      : null;

    return {
      id: approval.id,
      status: approval.status,
      snapshotHash: approval.snapshotHash,
      environment: approval.environment,
      approvedBy: user ? { id: user.id, email: user.email ?? undefined } : undefined,
      approvedAt: approval.approvedAt,
      expiresAt: approval.expiresAt,
      revokedAt: approval.revokedAt,
      brand: brand
        ? { id: brand.id, name: brand.name ?? undefined, tenantId: brand.tenantId ?? undefined }
        : undefined,
      tenantId: brand?.tenantId,
      correlationId: approval.suggestion?.correlationId ?? undefined,
      reason: null,
    };
  },

  async getExecutionDetail(executionId: string): Promise<ExecutionDetail> {
    const execution = await prisma.automationExecutionLedger.findUnique({
      where: { id: executionId },
      include: {
        executedBy: { select: { id: true, email: true } },
        approvalDecision: {
          select: {
            id: true,
            status: true,
            snapshotHash: true,
            environment: true,
            expiresAt: true,
            suggestion: { select: { brandId: true, correlationId: true } },
          },
        },
        rollbackExecutions: true,
      },
    });
    if (!execution) {
      throw notFound("Execution not found");
    }
    const approval = execution.approvalDecision;
    if (!approval) {
      throw notFound("Approval decision for execution missing");
    }
    const brand = approval.suggestion?.brandId
      ? await prisma.brand.findUnique({
          where: { id: approval.suggestion.brandId },
          select: { id: true, name: true, tenantId: true },
        })
      : null;
    const brandKillSwitch = approval.suggestion?.brandId
      ? await AutomationGovernanceRepository.getBrandKillSwitch(approval.suggestion.brandId)
      : null;
    const approvalKillSwitch = await AutomationGovernanceRepository.findActiveExecutionKillSwitch(
      "APPROVAL_DECISION",
      approval.id,
    );
    const executionKillSwitch = await AutomationGovernanceRepository.findActiveExecutionKillSwitch(
      "EXECUTION",
      execution.id,
    );
    const rollback = await AutomationGovernanceRepository.getRollbackByExecutionId(execution.id);

    const guardChecks = {
      approvalStatus: approval.status,
      snapshotHashMatched: execution.snapshotHash === approval.snapshotHash,
      suggestionMatched: execution.suggestionId === approval.suggestionId,
      environmentMatched: execution.environment === approval.environment,
      expired: approval.expiresAt ? approval.expiresAt <= execution.executedAt : false,
    };

    const killSwitch: KillSwitchSummary = {
      brandEnabled: Boolean(brandKillSwitch?.enabled),
      brandReason: brandKillSwitch?.reason ?? undefined,
      approvalKillSwitch: approvalKillSwitch
        ? formatKillSwitch(approvalKillSwitch, "approval")
        : undefined,
      executionKillSwitch: executionKillSwitch
        ? formatKillSwitch(executionKillSwitch, "execution")
        : undefined,
    };

    return {
      executionId: execution.id,
      status: execution.result,
      snapshotHash: execution.snapshotHash,
      environment: execution.environment,
      executedAt: execution.executedAt,
      executedBy: { id: execution.executedBy.id, email: execution.executedBy.email ?? undefined },
      actionType: execution.actionType,
      actionPayloadJson: execution.actionPayloadJson,
      metadataJson: execution.metadataJson,
      errorCode: execution.errorCode ?? undefined,
      errorMessage: execution.errorMessage ?? undefined,
      correlationId: approval.suggestion?.correlationId ?? undefined,
      guardChecks,
      killSwitch,
      rollback: rollback
        ? {
            id: rollback.id,
            status: rollback.status,
          }
        : null,
      brand: brand
        ? { id: brand.id, name: brand.name ?? undefined, tenantId: brand.tenantId ?? undefined }
        : undefined,
      tenantId: brand?.tenantId,
    };
  },
};

function formatKillSwitch(record: { id: string; reason: string; targetType: string; incidentId?: string }, scope: string): KillSwitchRecord {
  return {
    id: record.id,
    reason: record.reason,
    targetType: record.targetType,
    scope,
    incidentId: record.incidentId,
  };
}
