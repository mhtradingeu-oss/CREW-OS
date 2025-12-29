import { z } from "zod";
import { registerRunner } from "../registry.js";
import type { ActionContext, ActionResult } from "../types.js";
import type { ActionMetadata } from "../metadata.js";
import { logger } from "../../../logger.js";

const schema = z.object({
  level: z.enum(["info", "warn", "error"]).default("info"),
  message: z.string().min(1),
  meta: z.record(z.unknown()).optional(),
});

const sensitiveKeys = ["password", "jwt", "csrf", "token", "secret"];

function maskSecrets(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sensitiveKeys.some((term) => key.toLowerCase().includes(term)) ? "***" : maskSecrets(entry),
      ]),
    );
  }
  if (Array.isArray(value)) {
    return value.map((item) => maskSecrets(item));
  }
  return value;
}

const metadata: ActionMetadata = {
  risk: "LOW",
  sideEffect: "REVERSIBLE",
  description: "Emit structured automation logs for instrumentation and risk review.",
  version: "1.0",
  approvalHints: { requiresApprovalInProd: false, requiresApprovalInStaging: false },
};

const internalLogRunner = {
  type: "INTERNAL_LOG" as const,
  schema,
  metadata,
  async execute(context: ActionContext<z.infer<typeof schema>>): Promise<ActionResult> {
    const { level, message, meta } = context.actionConfig;
    const safeMeta = maskSecrets(meta ?? {});
    const logPayload = {
      runId: context.runId,
      actionRunId: context.actionRunId,
      ruleId: context.ruleId,
      ruleName: context.ruleName ?? null,
      eventName: context.event.type,
      eventId: context.event.id,
      meta: safeMeta,
    };
    const logFn = logger[level] ?? logger.info;
    logFn(`[automation][action][INTERNAL_LOG] ${message}`, logPayload);
    return { data: { logged: true } };
  },
};

registerRunner(internalLogRunner);
