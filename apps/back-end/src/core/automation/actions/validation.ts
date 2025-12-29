import "./index.js";

import { listRunners } from "./registry.js";
import { actionMetadataSchema } from "./metadata.js";
import type { ActionRunner } from "./types.js";

export interface ActionMetadataIssue {
  runnerType: ActionRunner["type"];
  errors: string[];
}

export function auditActionRunners(runners: ActionRunner[] = listRunners()): ActionMetadataIssue[] {
  return runners.reduce<ActionMetadataIssue[]>((acc, runner) => {
    const errors: string[] = [];
    if (!runner.metadata) {
      errors.push("metadata missing");
    } else {
      const parsed = actionMetadataSchema.safeParse(runner.metadata);
      if (!parsed.success) {
        errors.push(
          ...parsed.error.issues.map((issue) => {
            const path = issue.path.length ? issue.path.join(".") : "metadata";
            return `${path} ${issue.message}`;
          }),
        );
      }
    }
    if (errors.length) {
      acc.push({ runnerType: runner.type, errors });
    }
    return acc;
  }, []);
}

export function validateActionMetadataCompleteness(runners?: ActionRunner[]): void {
  const target = runners ?? listRunners();
  const issues = auditActionRunners(target);
  if (!issues.length) return;
  const message = issues.map((issue) => `${issue.runnerType}: ${issue.errors.join("; ")}`).join(" | ");
  throw new Error(`[automation][actions] metadata validation failed: ${message}`);
}

export function validateActionRegistryIntegrity(runners?: ActionRunner[]): void {
  const target = runners ?? listRunners();
  const integrityIssues: string[] = [];

  const metadataIssues = auditActionRunners(target);
  if (metadataIssues.length) {
    integrityIssues.push(
      ...metadataIssues.map((issue) => `${issue.runnerType}: ${issue.errors.join("; ")}`),
    );
  }

  const seen = new Set<ActionRunner["type"]>();
  for (const runner of target) {
    if (seen.has(runner.type)) {
      integrityIssues.push(`${runner.type}: duplicate action type`);
    } else {
      seen.add(runner.type);
    }
  }

  if (!integrityIssues.length) return;
  throw new Error(`[automation][actions] registry integrity failed: ${integrityIssues.join(" | ")}`);
}
