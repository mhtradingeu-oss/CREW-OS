import { z } from "zod";
import { logger } from "../../logger.js";
import type {
  AutomationExecutionActionContext,
  AutomationExecutionActionResult,
} from "./types.js";

const recordApprovalLogPayloadSchema = z.object({
  level: z.enum(["info", "warn", "error"]).default("info"),
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

type ExecutionActionDefinition<T extends z.ZodTypeAny> = {
  type: z.infer<T> extends { type: infer Discriminator }
    ? Discriminator extends string
      ? Discriminator
      : never
    : never;
  schema: T;
  execute(
    payload: z.infer<T>,
    context: AutomationExecutionActionContext,
  ): Promise<AutomationExecutionActionResult>;
};

const actionDefinitions: Record<
  AutomationExecutionAction["type"],
  ExecutionActionDefinition<z.ZodObject<any>>
> = {
  recordApprovalLog: {
    type: "recordApprovalLog",
    schema: recordApprovalLogPayloadSchema,
    async execute(payload, context) {
      const logFn = logger[payload.level] ?? logger.info;
      logFn("[automation][execution][action] approval log", {
        module: "automation-execution",
        action: "recordApprovalLog",
        executionId: context.executionId,
        approvalDecisionId: context.approvalDecisionId,
        suggestionId: context.suggestionId,
        snapshotHash: context.snapshotHash,
        environment: context.environment,
        executedBy: context.executedById,
        correlationId: context.correlationId,
        actionMeta: payload.meta ?? null,
      });
      return { data: { recorded: true } };
    },
  },
};

export function resolveAutomationExecutionAction(type: AutomationExecutionAction["type"]) {
  return actionDefinitions[type];
}
