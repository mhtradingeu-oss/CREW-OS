import { createHash } from "crypto";
import type { AutomationActionRunStatus, AutomationRunStatus } from "../../db/repositories/automation-run.repository.js";
import type { DomainEvent } from "../../events/domain/types.js";
import type { AutomationRuleMatch } from "../engine/rule-matcher.js";
import "../actions/index.js";
import { getRunner } from "../actions/registry.js";
import { ActionConfig } from "../../../modules/automation/automation.types.js";
import { NonRetryableActionError, RetryableActionError } from "../actions/types.js";
import {
  createActionRun,
  createAutomationRun,
  finalizeAutomationRun,
  findActionRunByDedupKey,
  markRunRunning,
  updateActionRun,
  updateRuleLastRun,
} from "../../db/repositories/automation-run.repository.js";
import { logger } from "../../logger.js";
import { emitEvent } from "../../events/event-bus.js";
import { safeTruncate } from "../../ai/pipeline/pipeline-utils.js";

const ACTION_TIMEOUT_MS = 5000;
const MAX_BACKOFF_MULTIPLIER = 5;

export interface AutomationActionSummary {
  actionIndex: number;
  actionType: string;
  status: AutomationActionRunStatus | "SKIPPED";
  deduped?: boolean;
  dryRun?: boolean;
  attempt?: number;
  result?: Record<string, unknown>;
  error?: string;
  reason?: string;
  explain?: Record<string, unknown>;
  correlationId?: string;
}

export interface AutomationRunSummary {
  ruleId: string;
  ruleVersionId: string;
  runId?: string;
  status: AutomationRunStatus;
  actions: AutomationActionSummary[];
  startedAt?: Date;
  finishedAt?: Date;
  error?: string;
}

export async function executeAutomationActions({
  rule,
  event,
}: {
  rule: AutomationRuleMatch;
  event: DomainEvent;
}): Promise<AutomationRunSummary> {
  const actions = rule.actions ?? [];
  const dryRun = process.env.AUTOMATION_ENGINE_DRY_RUN === "1";

  if (!actions.length) {
    logger.info(`[automation][executor] no actions defined for rule ${rule.id}`, {
      ruleId: rule.id,
      ruleName: rule.name ?? null,
    });
  }

  if (dryRun) {
    const simulated = actions.map((action, index) => ({
      actionIndex: index,
      actionType: action.type,
      status: "SKIPPED" as const,
      dryRun: true,
      reason: "dry-run",
    }));
    return {
      ruleId: rule.id,
      ruleVersionId: rule.ruleVersionId,
      status: "SUCCESS",
      actions: simulated,
    };
  }

  const runRecord = await createAutomationRun({
    ruleId: rule.id,
    ruleVersionId: rule.ruleVersionId,
    eventName: event.type,
    eventId: event.id ?? null,
  });
  const runStart = new Date();
  await markRunRunning(runRecord.id);

  const summaries: AutomationActionSummary[] = [];
  let firstError: string | undefined;

  for (const [index, action] of actions.entries()) {
    const normalizedActionConfig = normalizeValue(action.params ?? {});
    const dedupKey = buildDedupKey(rule.id, event, index, normalizedActionConfig);
    const actionType = action.type ?? "UNKNOWN";
    const existingRun = await findActionRunByDedupKey(dedupKey);

    if (existingRun && existingRun.status === "SUCCESS") {
      summaries.push({
        actionIndex: index,
        actionType,
        status: "SKIPPED",
        deduped: true,
        reason: "previous-success",
      });
      continue;
    }

    let actionRun = existingRun;
    if (!actionRun) {
      actionRun = await createActionRun({
        runId: runRecord.id,
        actionIndex: index,
        actionType,
        dedupKey,
        actionConfig: normalizedActionConfig,
      });
    } else {
      actionRun = await updateActionRun(actionRun.id, {
        runId: runRecord.id,
        actionIndex: index,
        actionType,
        actionConfig: normalizedActionConfig,
        status: "PENDING",
        nextAttemptAt: null,
      });
    }

    const runner = getRunner(actionType);
    if (!runner) {
      const errorMessage = `No runner available for action type ${actionType}`;
      await updateActionRun(actionRun.id, {
        status: "FAILED",
        error: errorMessage,
        finishedAt: new Date(),
      });
      summaries.push({
        actionIndex: index,
        actionType,
        status: "FAILED",
        error: errorMessage,
      });
      firstError ??= errorMessage;
      continue;
    }

    const attemptNumber = (actionRun.attemptCount ?? 0) + 1;
    await updateActionRun(actionRun.id, {
      status: "RUNNING",
      attemptCount: attemptNumber,
      startedAt: new Date(),
      nextAttemptAt: null,
    });

    let validatedConfig: ActionConfig["params"];
    try {
      validatedConfig = runner.validate ? runner.validate(action.params ?? {}) : runner.schema.parse(action.params ?? {});
    } catch (validationError) {
      const message = `Action validation failed: ${getErrorMessage(validationError)}`;
      await updateActionRun(actionRun.id, {
        status: "FAILED",
        error: message,
        finishedAt: new Date(),
      });
      summaries.push({
        actionIndex: index,
        actionType,
        status: "FAILED",
        error: message,
      });
      firstError ??= message;
      continue;
    }

    // --- POLICY GATE: canPerform ---
    
    const { canPerform } = require("../policy/can-perform.js");
    const correlationId = event.meta?.requestId ?? event.id;
    // إعداد مدخلات السياسة
    const policyInput = {
      actionId: actionType,
      metadata: runner.metadata ?? { risk: "LOW", sideEffect: "NONE", description: "" },
      environment: process.env.NODE_ENV === "production" ? "production" : (process.env.NODE_ENV === "staging" ? "staging" : "development"),
      approvals: undefined, // approvals غير متوفرة في هذا السياق
      flags: {
        AI_AUTONOMY_ENABLED: process.env.AI_AUTONOMY_ENABLED !== "false",
        AI_MAX_RISK: process.env.AI_MAX_RISK as any || "CRITICAL",
        AI_KILL_SWITCH: process.env.AI_KILL_SWITCH === "true",
      },
    };
    const policyDecision = canPerform({ ...policyInput, correlationId });
    if (policyDecision.type === "DENY" || policyDecision.type === "REQUIRE_APPROVAL") {
      const status = policyDecision.type === "DENY" ? "FAILED" : "PENDING";
      await updateActionRun(actionRun.id, {
        status,
        error: policyDecision.reason,
        finishedAt: new Date(),
      });
      summaries.push({
        actionIndex: index,
        actionType,
        status,
        error: policyDecision.reason,
        reason: policyDecision.reason,
        explain: policyDecision.explain,
        correlationId: policyDecision.correlationId,
      });
      // Emit audit event for DENY or REQUIRE_APPROVAL
      await emitEvent(
        status === "FAILED" ? "automation.action.denied" : "automation.action.pending_approval",
        {
          ruleId: rule.id,
          ruleVersionId: rule.ruleVersionId,
          actionType,
          actionIndex: index,
          status,
          reason: policyDecision.reason,
          explain: policyDecision.explain,
          correlationId: policyDecision.correlationId,
          eventId: event.id,
          eventType: event.type,
          truncatedInput: safeTruncate(normalizedActionConfig, 400),
        },
        { correlationId: policyDecision.correlationId }
      );
      firstError ??= policyDecision.reason;
      continue;
    }
        // Emit audit event for ALLOW
        await emitEvent(
          "automation.action.allowed",
          {
            ruleId: rule.id,
            ruleVersionId: rule.ruleVersionId,
            actionType,
            actionIndex: index,
            status: "ALLOWED",
            eventId: event.id,
            eventType: event.type,
            correlationId,
            truncatedInput: safeTruncate(normalizedActionConfig, 400),
          },
          { correlationId }
        );
    // --- END POLICY GATE ---
    try {
      const result = await executeWithTimeout(
        runner.execute({
          runId: runRecord.id,
          actionRunId: actionRun.id,
          ruleId: rule.id,
          ruleName: rule.name,
          event,
          actionConfig: validatedConfig,
        }),
        ACTION_TIMEOUT_MS,
      );

      await updateActionRun(actionRun.id, {
        status: "SUCCESS",
        result: result.data,
        finishedAt: new Date(),
      });
      summaries.push({
        actionIndex: index,
        actionType,
        status: "SUCCESS",
        attempt: attemptNumber,
        result: result.data,
      });
    } catch (error) {
      const isRetryable = error instanceof RetryableActionError;
      const status = isRetryable ? "RETRYING" : "FAILED";
      const errorMessage = getErrorMessage(error);
      const nextAttempt = isRetryable ? new Date(Date.now() + computeBackoff(attemptNumber)) : null;
      await updateActionRun(actionRun.id, {
        status,
        error: errorMessage,
        finishedAt: new Date(),
        nextAttemptAt: nextAttempt,
        attemptCount: attemptNumber,
      });
      summaries.push({
        actionIndex: index,
        actionType,
        status,
        attempt: attemptNumber,
        error: errorMessage,
      });
      if (!isRetryable) {
        firstError ??= errorMessage;
      }
    }
  }

  const hasFailure = summaries.some((summary) => summary.status === "FAILED");
  const hasRetrying = summaries.some((summary) => summary.status === "RETRYING");
  const finalStatus: AutomationRunStatus = hasFailure
    ? "FAILED"
    : hasRetrying
      ? "PARTIAL"
      : "SUCCESS";

  const runSummary = {
    ruleId: rule.id,
    ruleVersionId: rule.ruleVersionId,
    ruleName: rule.name,
    event: { name: event.type, id: event.id },
    actions: summaries,
  };

  await finalizeAutomationRun({
    runId: runRecord.id,
    status: finalStatus,
    summary: runSummary,
    error: firstError ?? null,
  });
  await updateRuleLastRun(rule.id, finalStatus);

  return {
    ruleId: rule.id,
    ruleVersionId: rule.ruleVersionId,
    runId: runRecord.id,
    status: finalStatus,
    actions: summaries,
    startedAt: runStart,
    finishedAt: new Date(),
    error: firstError,
  };
}

function buildDedupKey(
  ruleId: string,
  event: DomainEvent,
  actionIndex: number,
  actionConfig: unknown,
): string {
  const payload = {
    ruleId,
    eventName: event.type,
    eventId: event.id ?? null,
    actionIndex,
    actionConfig,
  };
  const hash = createHash("sha256");
  hash.update(JSON.stringify(normalizeValue(payload)));
  return hash.digest("hex");
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeValue(item));
  }
  if (value && typeof value === "object") {
    const sortedEntries = Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => [key, normalizeValue(val)]);
    return Object.fromEntries(sortedEntries);
  }
  return value;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function computeBackoff(attempts: number) {
  const multiplier = Math.min(MAX_BACKOFF_MULTIPLIER, attempts);
  return multiplier * 1000;
}

async function executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Action timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
