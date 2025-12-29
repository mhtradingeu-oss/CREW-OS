import { z } from "zod";
import { logger } from "../../logger.js";
import type {
  AutomationExecutionActionContext,
  AutomationExecutionActionResult,
} from "./types.js";

const recordApprovalLogPayloadSchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]).default("info"),
  message: z.string().min(1),
  meta: z.record(z.unknown()).optional(),
});

export const automationExecutionActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("recordApprovalLog"),
    payload: recordApprovalLogPayloadSchema,
  }),
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

const actionDefinitions = {
  recordApprovalLog: recordApprovalLogAction,
} as const;

export function resolveAutomationExecutionAction(type: AutomationExecutionAction["type"]) {
  return actionDefinitions[type];
}
