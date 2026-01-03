import { z } from "zod";
import {
  Prisma,
  AutomationRule as PrismaAutomationRule,
  AutomationRunStatus,
  AutomationRuleLifecycleState,
} from "@prisma/client";
import { prisma } from "../../core/prisma.js";
import type { EventEnvelope } from "../../core/events/event-bus.js";
import type { AutomationRule as AutomationRuleDto } from "@mh-os/shared";
import type { PolicyViolation, AutomationGateError } from "./automation.types.js";

type PolicyStatus = "ok" | "blocked" | "review_required";

type AutomationServiceDeps = {
  notificationService: any;
  pricingService: any;
  publish: (...args: any[]) => Promise<void>;
  publishActivity: (...args: any[]) => Promise<void>;
  badRequest: (message: string) => Error;
  notFound: (message: string) => Error;
  ruleVersionSelect?: any;
  ruleSelect?: any;
  ruleVersionSelectUnsafe?: any;
  db?: typeof prisma;
};

type RunResult = {
  ruleId: string;
  runId: string;
  status: AutomationRunStatus;
  skipped?: boolean;
};

const actionSchema = z.object({
  type: z.enum([
    "notification",
    "log",
    "crm.createTask",
    "inventory.createRefillRequest",
    "pricing.flagDraftForApproval",
  ]),
  params: z.record(z.unknown()).optional(),
});

const actionsWrapperSchema = z.object({
  actions: z.array(actionSchema).min(1, "At least one action is required"),
});

const conditionSchema = z.object({
  path: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "lt", "includes"]),
  value: z.unknown().optional(),
});

const conditionsWrapperSchema = z
  .object({
    all: z.array(conditionSchema).optional(),
    any: z.array(conditionSchema).optional(),
  })
  .refine((v) => (v.all?.length ?? 0) + (v.any?.length ?? 0) > 0, {
    message: "At least one condition is required (all/any).",
  });

export class AutomationService {
  constructor(private readonly deps: AutomationServiceDeps) {}

  private get database() {
    return this.deps.db ?? prisma;
  }

  public async list(args: {
    brandId?: string | null;
    page?: number;
    pageSize?: number;
    state?: AutomationRuleLifecycleState;
  } = {}) {
    const page = Math.max(1, args.page ?? 1);
    const pageSize = Math.min(Math.max(args.pageSize ?? 20, 1), 100);
    const skip = (page - 1) * pageSize;

    const where: Prisma.AutomationRuleWhereInput = {
      enabled: true,
      state: args.state ?? undefined,
    };
    if (args.brandId) {
      where.brandId = args.brandId;
    }

    const [total, rows] = await this.database.$transaction([
      this.database.automationRule.count({ where }),
      this.database.automationRule.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take: pageSize,
        skip,
      }),
    ]);

    return {
      items: rows.map((row) => this.serializeRule(row)),
      total,
      page,
      pageSize,
    };
  }

  public async getById(id: string) {
    const rule = await this.database.automationRule.findUnique({ where: { id } });
    if (!rule) {
      throw this.deps.notFound("Automation rule not found");
    }
    return this.serializeRule(rule);
  }

  public async create(input: {
    name: string;
    description?: string | null;
    brandId?: string | null;
    createdById?: string | null;
  }) {
    const rule = await this.database.automationRule.create({
      data: {
        name: input.name,
        description: input.description ?? null,
        brandId: input.brandId ?? null,
        enabled: true,
        state: AutomationRuleLifecycleState.DRAFT,
        createdById: input.createdById ?? null,
        updatedById: input.createdById ?? null,
      },
    });
    return this.serializeRule(rule);
  }

  public async update(
    ruleId: string,
    input: {
      triggerEvent: string;
      conditionConfigJson: unknown;
      actionsConfigJson: unknown;
      metaSnapshotJson?: unknown;
      createdById?: string | null;
    },
  ) {
    const rule = await this.database.automationRule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw this.deps.notFound("Automation rule not found");
    }

    const latestVersion = await this.database.automationRuleVersion.findFirst({
      where: { ruleId },
      orderBy: { versionNumber: "desc" },
    });

    const versionNumber = (latestVersion?.versionNumber ?? 0) + 1;

    const conditionJson = this.toJsonValue(input.conditionConfigJson);
    const actionsJson = this.toJsonValue(input.actionsConfigJson);
    const metaJson = this.toJsonValue(input.metaSnapshotJson);

    await this.database.automationRuleVersion.create({
      data: {
        rule: { connect: { id: ruleId } },
        versionNumber,
        triggerEvent: input.triggerEvent,
        conditionConfigJson: conditionJson,
        actionsConfigJson: actionsJson,
        metaSnapshotJson: metaJson,
        createdById: input.createdById ?? null,
        state: AutomationRuleLifecycleState.ACTIVE,
      },
    });

    const updated = await this.database.automationRule.update({
      where: { id: ruleId },
      data: {
        triggerEvent: input.triggerEvent,
        state: AutomationRuleLifecycleState.ACTIVE,
        enabled: true,
        updatedById: input.createdById ?? null,
      },
    });

    return this.serializeRule(updated);
  }

  public async remove(id: string) {
    const rule = await this.database.automationRule.findUnique({ where: { id } });
    if (!rule) {
      throw this.deps.notFound("Automation rule not found");
    }
    await this.database.automationRule.delete({ where: { id } });
    return { id };
  }

  public async runScheduled(date: Date) {
    const syntheticEvent: EventEnvelope<unknown> = {
      id: `scheduled-${date.toISOString()}-${Date.now()}`,
      name: "automation.scheduled",
      payload: { scheduledAt: date.toISOString() },
      context: { source: "system" },
      occurredAt: new Date(),
    } as EventEnvelope<unknown>;

    const results = await this.handleEvent(syntheticEvent);
    return {
      triggered: results.length,
      processedAt: date.toISOString(),
    };
  }

  public async runRule(
    ruleId: string,
    context: {
      brandId?: string | null;
      actorUserId?: string | null;
      tenantId?: string | null;
      role?: string | null;
      source?: string;
      correlationId?: string;
    },
  ) {
    const rule = await this.database.automationRule.findUnique({ where: { id: ruleId } });
    if (!rule) {
      throw this.deps.notFound("Automation rule not found");
    }
    if (!rule.triggerEvent) {
      throw this.deps.badRequest("Automation rule has no trigger event configured");
    }

    const manualEvent: EventEnvelope<unknown> = {
      id: `manual-${ruleId}-${Date.now()}`,
      name: rule.triggerEvent,
      payload: { manual: true, context },
      context: {
        brandId: rule.brandId ?? context.brandId ?? undefined,
        tenantId: context.tenantId ?? undefined,
        actorUserId: context.actorUserId ?? undefined,
        source: context.source ?? "manual",
        correlationId: context.correlationId,
        role: context.role ?? undefined,
      },
      occurredAt: new Date(),
    } as EventEnvelope<unknown>;

    const results = await this.handleEvent(manualEvent);
    return { triggered: results.length, ruleId, eventName: manualEvent.name };
  }

  public async handleEvent(event: EventEnvelope<unknown>) {
    const where: Prisma.AutomationRuleWhereInput = {
      enabled: true,
      state: AutomationRuleLifecycleState.ACTIVE,
      triggerEvent: event.name,
    };
    const orClauses: Prisma.AutomationRuleWhereInput[] = [{ brandId: null }];
    if (event.context?.brandId) {
      orClauses.push({ brandId: event.context.brandId });
    }
    where.OR = orClauses;

    const rules = await this.database.automationRule.findMany({ where });
    const results: RunResult[] = [];

    for (const rule of rules) {
      const dedupKey = event.id ? `${event.id}:${rule.id}` : undefined;
      const result = await this.executeRule(rule, event, dedupKey);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  private async executeRule(rule: PrismaAutomationRule, event: EventEnvelope<unknown>, dedupKey?: string) {
    const activeVersion = await this.database.automationRuleVersion.findFirst({
      where: { ruleId: rule.id, state: AutomationRuleLifecycleState.ACTIVE },
      orderBy: { versionNumber: "desc" },
    });
    if (!activeVersion) {
      return null;
    }

    if (dedupKey) {
      const existing = await this.database.automationRun.findFirst({
        where: { ruleId: rule.id, dedupKey },
      });
      if (existing) {
        await this.recordLog(rule, event, existing.status, { message: "duplicate event" });
        return { ruleId: rule.id, runId: existing.id, status: existing.status, skipped: true };
      }
    }

    const run = await this.database.automationRun.create({
      data: {
        ruleId: rule.id,
        ruleVersionId: activeVersion.id,
        eventName: event.name,
        eventId: event.id,
        status: AutomationRunStatus.RUNNING,
        startedAt: new Date(),
        triggerEventJson: this.toJsonValue(event.payload),
        conditionsJson: this.toJsonValue(activeVersion.conditionConfigJson),
        actionsJson: this.toJsonValue(activeVersion.actionsConfigJson),
        ruleMetaJson: this.toJsonValue(activeVersion.metaSnapshotJson),
        dedupKey: dedupKey ?? undefined,
      },
    });

    const finished = await this.database.automationRun.update({
      where: { id: run.id },
      data: {
        status: AutomationRunStatus.SUCCESS,
        finishedAt: new Date(),
        summaryJson: { correlationId: event.context?.correlationId ?? null },
      },
    });

    await this.database.automationRule.update({
      where: { id: rule.id },
      data: {
        lastRunAt: finished.finishedAt ?? finished.startedAt,
        lastRunStatus: finished.status,
      },
    });

    await this.recordLog(rule, event, finished.status, { runId: finished.id });

    return { ruleId: rule.id, runId: finished.id, status: finished.status };
  }

  private async recordLog(rule: PrismaAutomationRule, event: EventEnvelope<unknown>, status: AutomationRunStatus, details: Record<string, unknown>) {
    await this.database.automationLog.create({
      data: {
        brandId: rule.brandId ?? (event.context?.brandId ?? null),
        eventName: event.name,
        ruleId: rule.id,
        result: status,
        detailsJson: JSON.stringify({
          eventId: event.id,
          correlationId: event.context?.correlationId ?? null,
          ...details,
        }),
      },
    });
  }

  private serializeRule(rule: PrismaAutomationRule): AutomationRuleDto {
    return {
      id: rule.id,
      brandId: rule.brandId ?? undefined,
      name: rule.name,
      description: rule.description ?? undefined,
      state: rule.state,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
      createdById: rule.createdById ?? undefined,
      updatedById: rule.updatedById ?? undefined,
      lastRunAt: rule.lastRunAt ? rule.lastRunAt.toISOString() : undefined,
      lastRunStatus: rule.lastRunStatus ?? undefined,
    };
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    return value ?? Prisma.JsonNull;
  }

  // Gate helpers retained for future policy integration
  private gateError(code: AutomationGateError["code"], message: string): AutomationGateError {
    return { code, message };
  }

  public policyGatePreSave(input: {
    ruleVersion: unknown;
    userRole?: string;
    permissions?: string[];
  }): PolicyViolation[] {
    // Phase 6: Only versioned rule fields are checked. Implement new logic as needed.
    return [];
  }

  public activationGatePreActivate(input: {
    ruleVersion: unknown;
    policyStatus: PolicyStatus;
    permissions: string[];
  }): PolicyViolation[] {
    const { ruleVersion, policyStatus, permissions } = input;
    const violations: PolicyViolation[] = [];

    if (policyStatus === "blocked") {
      violations.push({
        code: "automation.policy.blocked",
        message: "Policy status is blocked. Activation denied.",
      });
      return violations;
    }

    if (!permissions.includes("automation:rules:activate")) {
      violations.push({
        code: "automation.permission.missing",
        message: "Missing permission 'automation:rules:activate'.",
      });
      return violations;
    }

    const versionSchema = z.object({
      state: z.enum(["DRAFT", "REVIEW", "ACTIVE", "PAUSED", "DISABLED"]),
      triggerEvent: z.string().optional(),
      actionsConfigJson: z.unknown().optional(),
      conditionConfigJson: z.unknown().optional(),
    });

    const parsed = versionSchema.safeParse(ruleVersion);
    if (!parsed.success) {
      violations.push({
        code: "automation.rule_version.invalid",
        message: parsed.error.issues.map((i) => i.message).join("; "),
      });
      return violations;
    }

    if (parsed.data.actionsConfigJson !== undefined) {
      const actionsOk = actionsWrapperSchema.safeParse(parsed.data.actionsConfigJson);
      if (!actionsOk.success) {
        violations.push({
          code: "automation.actions.invalid",
          message: actionsOk.error.issues.map((i) => i.message).join("; "),
        });
      }
    }

    if (parsed.data.conditionConfigJson !== undefined) {
      const condOk = conditionsWrapperSchema.safeParse(parsed.data.conditionConfigJson);
      if (!condOk.success) {
        violations.push({
          code: "automation.conditions.invalid",
          message: condOk.error.issues.map((i) => i.message).join("; "),
        });
      }
    }

    return violations;
  }

  public toGateError(violations: PolicyViolation[]): AutomationGateError | null {
    if (!violations.length) return null;
    return this.gateError(
      "AUTOMATION_GATE_BLOCKED",
      violations.map((v) => v.message).join(" | "),
    );
  }
}

import { publish } from "../../core/events/event-bus.js";
import { publishActivity } from "../../core/activity/activity.js";
import { badRequest, notFound } from "../../core/http/errors.js";

export const automationService = new AutomationService({
  notificationService: {},
  pricingService: {},
  publish,
  publishActivity,
  badRequest,
  notFound,
});
