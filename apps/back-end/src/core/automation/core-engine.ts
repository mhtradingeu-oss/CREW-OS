import { Prisma, AutomationRule, AutomationRuleLifecycleState, AutomationRuleVersion, AutomationRunStatus, AutomationActionRunStatus, AutomationIncidentSeverity, AutomationIncidentType } from "@prisma/client";
import { prisma } from "../prisma.js";
import { notificationService } from "../../modules/notification/notification.service.js";
import { automationIncidentService } from "./governance/incident.service.js";
import { automationKillSwitchService, type AutomationKillSwitchService, type KillSwitchContext } from "./governance/kill-switch.service.js";
import { createId } from "@paralleldrive/cuid2";
import { logger } from "../logger.js";

export type AutomationEventContext = {
  brandId?: string | null;
  tenantId?: string | null;
  actorUserId?: string | null;
  correlationId?: string | null;
};

export type AutomationEngineResult = {
  eventName: string;
  processedRules: number;
  outcomes: AutomationRuleOutcome[];
};

export type AutomationRuleOutcome = {
  ruleId: string;
  status: "success" | "failed" | "skipped";
  reason?: string;
  actions: AutomationActionOutcome[];
};

export type AutomationActionOutcome = {
  actionIndex: number;
  actionType: string;
  status: "success" | "failed";
  notificationId?: string;
  error?: string;
};

type AutomationActionDefinition = {
  type: string;
  params?: Record<string, unknown>;
};

type NormalizedEventContext = Required<AutomationEventContext>;

type CoreAutomationEngineDependencies = {
  prisma?: typeof prisma;
  notificationService?: typeof notificationService;
  killSwitchService?: AutomationKillSwitchService;
  incidentService?: typeof automationIncidentService;
};

type LoadedAutomationRule = AutomationRule & {
  versions?: AutomationRuleVersion[];
};

export class CoreAutomationEngine {
  private readonly db: typeof prisma;
  private readonly notificationClient: typeof notificationService;
  private readonly killSwitch: AutomationKillSwitchService;
  private readonly incidentReporter: typeof automationIncidentService;

  constructor(deps: CoreAutomationEngineDependencies = {}) {
    this.db = deps.prisma ?? prisma;
    this.notificationClient = deps.notificationService ?? notificationService;
    this.killSwitch = deps.killSwitchService ?? automationKillSwitchService;
    this.incidentReporter = deps.incidentService ?? automationIncidentService;
  }

  async executeAutomationEvent(
    eventName: string,
    payload: unknown,
    context: AutomationEventContext = {},
  ): Promise<AutomationEngineResult> {
    const normalizedPayload = normalizePayload(payload);
    const normalizedContext = normalizeContext(context);
    this.killSwitch.assertGlobalEnabled(this.buildGlobalKillSwitchContext(normalizedContext));

    const rules = await this.db.automationRule.findMany({
      where: {
        enabled: true,
        triggerType: "event",
        triggerEvent: eventName,
        state: AutomationRuleLifecycleState.ACTIVE,
        OR: this.buildBrandFilters(normalizedContext.brandId),
      },
      include: {
        versions: {
          where: { state: AutomationRuleLifecycleState.ACTIVE },
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    const outcomes: AutomationRuleOutcome[] = [];

    for (const rule of rules) {
      const outcome = await this.runRule(rule, eventName, normalizedPayload, normalizedContext);
      outcomes.push(outcome);
    }

    return {
      eventName,
      processedRules: outcomes.length,
      outcomes,
    };
  }

  private buildBrandFilters(brandId?: string | null) {
    const clauses: Prisma.AutomationRuleWhereInput[] = [{ brandId: null }];
    if (brandId) {
      clauses.push({ brandId });
    }
    return clauses;
  }

  private buildGlobalKillSwitchContext(context: NormalizedEventContext): KillSwitchContext {
    return {
      module: "automation-core",
      action: "event",
      correlationId: context.correlationId ?? undefined,
      brandId: context.brandId ?? undefined,
    };
  }

  private async runRule(
    rule: LoadedAutomationRule,
    eventName: string,
    payload: Record<string, unknown>,
    context: NormalizedEventContext,
  ): Promise<AutomationRuleOutcome> {
    const actions = this.extractActions(rule.versions?.[0]?.actionsConfigJson ?? rule.actionsJson);
    if (!actions.length) {
      return { ruleId: rule.id, status: "skipped", actions: [], reason: "no actions configured" };
    }

    const logRecord = await this.db.automationExecutionLog.create({
      data: {
        ruleId: rule.id,
        eventName,
        status: "STARTED",
        resultJson: JSON.stringify({ payload, context }),
        runAt: new Date(),
      },
    });

    const version = await this.ensureRuleVersion(rule, eventName, actions);
    if (!version) {
      await this.db.automationExecutionLog.update({
        where: { id: logRecord.id },
        data: {
          status: "FAILED",
          errorMessage: "missing rule version",
        },
      });
      return { ruleId: rule.id, status: "failed", reason: "missing rule version", actions: [] };
    }

    const runRecord = await this.db.automationRun.create({
      data: {
        ruleId: rule.id,
        ruleVersionId: version.id,
        eventName,
        eventId: context.correlationId ?? null,
        status: AutomationRunStatus.RUNNING,
        startedAt: new Date(),
        triggerEventJson: this.toJsonValue(payload),
        actionsJson: this.toJsonValue(actions),
      },
    });

    await this.killSwitch.ensureExecutionAllowed(runRecord.id, this.buildKillSwitchContext(context, rule, runRecord.id));

    const actionOutcomes: AutomationActionOutcome[] = [];
    let runError: string | undefined;

    for (const [index, action] of actions.entries()) {
      if (action.type !== "notification") {
        runError = `unsupported action type ${action.type}`;
        actionOutcomes.push({
          actionIndex: index,
          actionType: action.type,
          status: "failed",
          error: runError,
        });
        break;
      }

      const outcome = await this.executeNotificationAction(
        action,
        index,
        runRecord.id,
        payload,
        context,
        rule,
      );
      actionOutcomes.push(outcome);
      if (outcome.status === "failed") {
        runError = outcome.error;
        break;
      }
    }

    const finalStatus = runError ? AutomationRunStatus.FAILED : AutomationRunStatus.SUCCESS;
    const finishedAt = new Date();

    await this.db.automationRun.update({
      where: { id: runRecord.id },
      data: {
        status: finalStatus,
        finishedAt,
        summaryJson: this.toJsonValue({ actions: actionOutcomes }),
        errorJson: this.toJsonValue(runError ? { message: runError } : null),
      },
    });

    await this.db.automationExecutionLog.update({
      where: { id: logRecord.id },
      data: {
        status: finalStatus === AutomationRunStatus.SUCCESS ? "SUCCESS" : "FAILED",
        resultJson: JSON.stringify({
          actions: actionOutcomes,
          payload,
          context,
        }),
        errorMessage: runError ?? undefined,
      },
    });

    if (runError) {
      await this.recordIncident(rule, runRecord.id, eventName, runError, payload, context);
      return { ruleId: rule.id, status: "failed", reason: runError, actions: actionOutcomes };
    }

    logger.info("[automation-core] rule executed", { ruleId: rule.id, eventName, outcomes: actionOutcomes });
    return { ruleId: rule.id, status: "success", actions: actionOutcomes };
  }

  private async executeNotificationAction(
    action: AutomationActionDefinition,
    index: number,
    runId: string,
    payload: Record<string, unknown>,
    context: NormalizedEventContext,
    rule: AutomationRule,
  ): Promise<AutomationActionOutcome> {
    const actionRun = await this.db.automationActionRun.create({
      data: {
        runId,
        actionIndex: index,
        actionType: action.type,
        dedupKey: createId(),
        actionConfigJson: this.toJsonValue(action.params ?? {}),
      },
    });

    const startedAt = new Date();
    await this.db.automationActionRun.update({
      where: { id: actionRun.id },
      data: {
        status: AutomationActionRunStatus.RUNNING,
        startedAt,
      },
    });

    const rendered = this.renderNotificationParams(action.params ?? {}, payload, context, rule);

    if (!rendered.title || !rendered.message) {
      const error = "notification title or message missing";
      await this.failActionRun(actionRun.id, error);
      return {
        actionIndex: index,
        actionType: action.type,
        status: "failed",
        error,
      };
    }

    try {
      const notification = await this.notificationClient.createNotification({
        brandId: rendered.brandId,
        userId: rendered.userId,
        type: rendered.type,
        title: rendered.title,
        message: rendered.message,
        data: {
          eventName: rule.triggerEvent,
          payload,
          context,
          ...(rendered.data ?? {}),
        },
      });

      const finishedAt = new Date();
      await this.db.automationActionRun.update({
        where: { id: actionRun.id },
        data: {
          status: AutomationActionRunStatus.SUCCESS,
          resultJson: this.toJsonValue({ notificationId: notification.id }),
          finishedAt,
        },
      });

      return {
        actionIndex: index,
        actionType: action.type,
        status: "success",
        notificationId: notification.id,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      await this.failActionRun(actionRun.id, message);
      return {
        actionIndex: index,
        actionType: action.type,
        status: "failed",
        error: message,
      };
    }
  }

  private async failActionRun(actionRunId: string, errorMessage: string) {
    const now = new Date();
    await this.db.automationActionRun.update({
      where: { id: actionRunId },
      data: {
        status: AutomationActionRunStatus.FAILED,
        errorJson: this.toJsonValue({ message: errorMessage }),
        finishedAt: now,
      },
    });
  }

  private renderNotificationParams(
    params: Record<string, unknown>,
    payload: Record<string, unknown>,
    context: NormalizedEventContext,
    rule: AutomationRule,
  ) {
    const scope = {
      payload,
      context: {
        brandId: context.brandId,
        tenantId: context.tenantId,
        actorUserId: context.actorUserId,
        correlationId: context.correlationId,
      },
    };

    const brandId =
      (typeof params.brandId === "string" ? params.brandId : null) ?? context.brandId ?? rule.brandId ?? null;
    const userId = (typeof params.userId === "string" ? params.userId : null) ?? context.actorUserId ?? undefined;

    const title = renderTemplate(params.title, scope);
    const message = renderTemplate(params.message, scope);
    const type = typeof params.type === "string" ? params.type : undefined;

    return {
      brandId: brandId ?? undefined,
      userId,
      title,
      message,
      type,
      data: typeof params.data === "object" && params.data !== null ? params.data as Record<string, unknown> : undefined,
    };
  }

  private buildKillSwitchContext(context: NormalizedEventContext, rule: AutomationRule, executionId: string): KillSwitchContext {
    return {
      module: "automation-core",
      action: "event",
      correlationId: context.correlationId ?? undefined,
      brandId: rule.brandId ?? context.brandId ?? undefined,
      executionId,
    };
  }

  private async ensureRuleVersion(
    rule: LoadedAutomationRule,
    eventName: string,
    actions: AutomationActionDefinition[],
  ): Promise<AutomationRuleVersion | null> {
    if (rule.versions?.[0]) {
      return rule.versions[0];
    }
    const payload = this.toJsonValue(rule.actionsJson ?? { actions });
    try {
      return await this.db.automationRuleVersion.create({
        data: {
          ruleId: rule.id,
          versionNumber: 1,
          triggerEvent: rule.triggerEvent ?? eventName,
          conditionConfigJson: Prisma.JsonNull,
          actionsConfigJson: payload,
          state: AutomationRuleLifecycleState.ACTIVE,
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        return this.db.automationRuleVersion.findFirst({
          where: { ruleId: rule.id },
          orderBy: { versionNumber: "desc" },
        });
      }
      throw error;
    }
  }

  private extractActions(value: Prisma.JsonValue | string | null | undefined): AutomationActionDefinition[] {
    if (!value) {
      return [];
    }

    let parsed: unknown = value;
    if (typeof value === "string") {
      try {
        parsed = JSON.parse(value);
      } catch {
        logger.warn("[automation-core] invalid action payload", { ruleActions: value });
        return [];
      }
    }

    if (Array.isArray(parsed)) {
      return parsed
        .filter((item): item is AutomationActionDefinition => Boolean(item && typeof item === "object" && typeof (item as Record<string, unknown>).type === "string"))
        .map((item) => item as AutomationActionDefinition);
    }

    if (parsed && typeof parsed === "object") {
      const actionsCandidate = (parsed as { actions?: unknown }).actions;
      if (Array.isArray(actionsCandidate)) {
        return actionsCandidate
          .filter((entry): entry is AutomationActionDefinition => Boolean(entry && typeof entry === "object" && typeof (entry as Record<string, unknown>).type === "string"))
          .map((entry) => entry as AutomationActionDefinition);
      }
      const parsedRecord = parsed as Record<string, unknown>;
      if (typeof parsedRecord.type !== "string") {
        throw new Error("Invalid automation action type");
      }
      return [{
        type: parsedRecord.type,
        params: parsedRecord.params as Record<string, unknown> | undefined,
      }];
    }

    return [];
  }

  private async recordIncident(
    rule: AutomationRule,
    executionId: string,
    eventName: string,
    error: string,
    payload: Record<string, unknown>,
    context: NormalizedEventContext,
  ) {
    try {
      await this.incidentReporter.createIncident({
        incidentType: AutomationIncidentType.AUTOMATION_FAILURE,
        severity: AutomationIncidentSeverity.HIGH,
        description: error,
        metadata: {
        ruleId: rule.id,
        eventName,
        payload: JSON.parse(JSON.stringify(payload)), // Ensures valid JSON
        context,
        },
      });
    } catch (incidentError) {
      logger.warn("[automation-core] failed to record incident", { error: incidentError });
    }
  }

  private toJsonValue(value: unknown): Prisma.InputJsonValue {
    if (value === undefined) {
      return Prisma.JsonNull as unknown as Prisma.InputJsonValue;
    }
    return value as Prisma.InputJsonValue;
  }
}

function normalizePayload(payload: unknown): Record<string, unknown> {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload as Record<string, unknown>;
  }
  return { value: payload };
}

function normalizeContext(context: AutomationEventContext): NormalizedEventContext {
  return {
    brandId: context.brandId ?? null,
    tenantId: context.tenantId ?? null,
    actorUserId: context.actorUserId ?? null,
    correlationId: context.correlationId ?? null,
  };
}

function renderTemplate(template: unknown, scope: { payload: Record<string, unknown>; context: Record<string, unknown | null> }): string | undefined {
  if (typeof template !== "string") {
    return undefined;
  }
  return template.replace(/\{\{\s*(payload|context)(?:\.([\w.]+))?\s*\}\}/g, (_match, source: string, path?: string) => {
    const sourceObject = source === "payload" ? scope.payload : scope.context;
    const value = path ? resolvePath(sourceObject, path) : sourceObject;
    return stringifyValue(value);
  });
}

function resolvePath(target: Record<string, unknown | null>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, target);
}

function stringifyValue(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isUniqueConstraintError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export const coreAutomationEngine = new CoreAutomationEngine();
