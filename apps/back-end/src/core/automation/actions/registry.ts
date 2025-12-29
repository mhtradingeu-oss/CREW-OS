import { logger } from "../../logger.js";
import { actionMetadataSchema } from "./metadata.js";
import type { ActionRunner, ActionType } from "./types.js";

const runners = new Map<ActionType, ActionRunner>();

export function registerRunner(runner: ActionRunner): void {
  const metadataValidation = actionMetadataSchema.safeParse(runner.metadata);
  if (!metadataValidation.success) {
    const message = metadataValidation.error.issues.map((issue) => issue.message).join("; ");
    logger.error(`[automation][actions] runner ${runner.type} metadata invalid`, {
      issues: metadataValidation.error.issues,
    });
    throw new Error(`[automation][actions] ${runner.type} metadata invalid: ${message}`);
  }
  if (runners.has(runner.type)) {
    logger.warn(`[automation][actions] runner for ${runner.type} already registered`, {});
    return;
  }
  runners.set(runner.type, runner);
}

export function getRunner(type: string): ActionRunner | undefined {
  return runners.get(type as ActionType);
}

export function listRunners(): ActionRunner[] {
  return Array.from(runners.values());
}
