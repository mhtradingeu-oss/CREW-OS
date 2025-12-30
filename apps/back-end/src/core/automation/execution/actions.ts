import { z } from "zod";
import { logger } from "../../logger.js";
import { badRequest, conflict, notFound } from "../../http/errors.js";
import { publish } from "../../events/event-bus.js";
import { AISuggestionRepository } from "../../db/repositories/ai-suggestions.repository.js";
import { runAutomationPlan } from "../engine/automation-engine.js";
import type {
  AutomationExecutionActionContext,
  AutomationExecutionActionResult,
} from "./types.js";
import { buildExecutionPlanFromSuggestion } from "./ai-suggestion-plan.js";

const recordApprovalLogPayloadSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  message: z.string().min(1),
  meta: z.record(z.unknown()).optional(),
});

const executeAiSuggestionActionSchema = z.object({
  type: z.literal("executeAiSuggestionPlan"),
  payload: z.record(z.unknown()).optional(),
});

export const automationExecutionActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("recordApprovalLog"),
    payload: recordApprovalLogPayloadSchema,
  }),
  executeAiSuggestionActionSchema,
]);

export type AutomationExecutionAction = z.infer<typeof automationExecutionActionSchema>;

type ExecutionActionDefinition<
  Type extends string,
  Schema extends z.ZodTypeAny,
> = {
  type: Type;
  schema: Schema;
  execute(
    payload: z.infer<Schema>,
    context: AutomationExecutionActionContext,
  ): Promise<AutomationExecutionActionResult>;
};

function defineExecutionAction<Type extends string, Schema extends z.ZodTypeAny>(
  definition: ExecutionActionDefinition<Type, Schema>,
) {
  return definition;
}

const recordApprovalLogAction = defineExecutionAction({
  type: "recordApprovalLog" as const,
  schema: recordApprovalLogPayloadSchema,
  async execute(payload, context) {
    const level = payload.level as keyof typeof logger;
    const logFn = logger[level] ?? logger.info;
    logFn("[automation][execution][action] approval log", {
      module: "automation-execution",
      action: "recordApprovalLog",
      executionId: context.executionId,
      approvalDecisionId: context.approvalDecisionId,
      suggestionId: context.suggestionId,
      snapshotHash: context.snapshotHash,
      environment: context.environment,
      executedBy: context.executedBy.connect.id,
      correlationId: context.correlationId,
      actionMeta: payload.meta ?? null,
    });
    return { data: { recorded: true } };
  },
});

export const executeAiSuggestionPlanAction = defineExecutionAction({
  type: "executeAiSuggestionPlan" as const,
  schema: executeAiSuggestionActionSchema,
  async execute(_payload, context) {
    const repository = new AISuggestionRepository();
    const suggestion = await repository.getSuggestionById(context.suggestionId);
    if (!suggestion) {
      throw notFound("Suggestion not found");
    }
    if (suggestion.status !== "approved") {
      throw conflict("Suggestion is not approved", null, "SUGGESTION_NOT_APPROVED");
    }
    if (suggestion.executedAt) {
      throw conflict("Suggestion already executed", null, "SUGGESTION_ALREADY_EXECUTED");
    }

    const actorUserId = context.executedBy.connect.id;
    const correlationId = context.correlationId ?? suggestion.correlationId ?? suggestion.id;
    const plan = buildExecutionPlanFromSuggestion({
      suggestionId: suggestion.id,
      domain: suggestion.domain,
      suggestionType: suggestion.suggestionType,
      proposedOutputJson: parseJsonField(suggestion.proposedOutputJson),
    });

    if ("error" in plan) {
      const planError = badRequest(plan.error, plan.details, "AI_SUGGESTION_PLAN_INVALID");
      await recordSuggestionFailure(repository, suggestion, actorUserId, correlationId, context, planError, {
        outputSnapshot: {
          error: plan.error,
          details: plan.details,
        },
      });
      throw planError;
    }

    try {
      const executionResult = await runAutomationPlan(plan, { actorUserId, correlationId });
      await repository.markSuggestionExecuted(suggestion.id, executionResult);
      await recordSuggestionSuccess(repository, suggestion, actorUserId, correlationId, context, executionResult);
      return { data: { executionResult } };
    } catch (error) {
      await recordSuggestionFailure(repository, suggestion, actorUserId, correlationId, context, error);
      throw error;
    }
  },
});

const actionDefinitions = {
  recordApprovalLog: recordApprovalLogAction,
  executeAiSuggestionPlan: executeAiSuggestionPlanAction,
} as const;

export function resolveAutomationExecutionAction(type: AutomationExecutionAction["type"]) {
  return actionDefinitions[type];
}

async function recordSuggestionSuccess(
  repository: AISuggestionRepository,
  suggestion: any,
  actorUserId: string,
  correlationId: string,
  _context: AutomationExecutionActionContext,
  executionResult: unknown,
) {
  const inputSnapshot = redactSecrets(safeParseJson(suggestion.inputSnapshotJson));
  const outputSnapshot = redactSecrets(executionResult);
  const eventContext = buildEventContext(suggestion, actorUserId, correlationId);
  await publish(
    "ai.suggestion.executed",
    {
      suggestionId: suggestion.id,
      correlationId,
      eventType: "ai.suggestion.executed",
      inputSnapshot,
      outputSnapshot,
    },
    eventContext,
  );
  await repository.appendAuditLog({
    eventType: "ai.suggestion.executed",
    suggestionId: suggestion.id,
    actorUserId,
    correlationId,
    inputSnapshot,
    outputSnapshot,
    timestamp: new Date().toISOString(),
  });
}

async function recordSuggestionFailure(
  repository: AISuggestionRepository,
  suggestion: any,
  actorUserId: string,
  correlationId: string,
  _context: AutomationExecutionActionContext,
  error: unknown,
  options?: { outputSnapshot?: unknown },
) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const inputSnapshot = redactSecrets(safeParseJson(suggestion.inputSnapshotJson));
  const outputSnapshot = redactSecrets(
    options?.outputSnapshot ?? { error: errorMessage },
  );
  await repository.markSuggestionFailed(suggestion.id, errorMessage);
  const eventContext = buildEventContext(suggestion, actorUserId, correlationId);
  await publish(
    "ai.suggestion.failed",
    {
      suggestionId: suggestion.id,
      correlationId,
      eventType: "ai.suggestion.failed",
      inputSnapshot,
      outputSnapshot,
    },
    eventContext,
  );
  await repository.appendAuditLog({
    eventType: "ai.suggestion.failed",
    suggestionId: suggestion.id,
    actorUserId,
    correlationId,
    inputSnapshot,
    outputSnapshot,
    timestamp: new Date().toISOString(),
  });
}

function buildEventContext(
  suggestion: any,
  actorUserId: string,
  correlationId: string,
) {
  return {
    module: "ai-suggestions",
    actorUserId,
    brandId: suggestion.brandId,
    tenantId: suggestion.tenantId,
    correlationId,
  };
}

function safeParseJson(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

function parseJsonField(value: unknown) {
  if (typeof value === "string") {
    return safeParseJson(value);
  }
  return value;
}

function redactSecrets(obj: unknown) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== "object") return obj;
  const SENSITIVE = ["secret", "apikey", "token", "password"];
  const redact = (value: any): any => {
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) =>
          SENSITIVE.includes(key.toLowerCase())
            ? [key, "[REDACTED]"]
            : [key, redact(val)],
        ),
      );
    }
    return value;
  };
  return redact(obj);
}
