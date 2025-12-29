import type { DomainEvent } from "../../events/domain/types.js";
import type { ActionConfig } from "../../../modules/automation/automation.types.js";
import type { ActionMetadata } from "./metadata.js";
import { z } from "zod";

export type ActionType = "INTERNAL_LOG";

export interface ActionContext<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  runId: string;
  actionRunId: string;
  ruleId: string;
  ruleName?: string;
  event: DomainEvent;
  actionConfig: TConfig;
}

export interface ActionResult {
  data?: Record<string, unknown>;
}

export abstract class ActionRunnerError extends Error {
  constructor(message: string, public readonly retryable: boolean = false) {
    super(message);
  }
}

export class RetryableActionError extends ActionRunnerError {
  constructor(message: string) {
    super(message, true);
  }
}

export class NonRetryableActionError extends ActionRunnerError {
  constructor(message: string) {
    super(message, false);
  }
}

export interface ActionRunner<TConfig extends Record<string, unknown> = Record<string, unknown>> {
  type: ActionType;
  schema: z.ZodType<TConfig>;
  metadata: ActionMetadata;
  execute(context: ActionContext<TConfig>): Promise<ActionResult>;
  validate?(config: unknown): TConfig;
}

export type RuleAction = ActionConfig;
