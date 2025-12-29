import type { DomainEvent } from "../../events/domain/types.js";
import { logger } from "../../logger.js";
import { loadMatchingRulesForEvent } from "./rule-matcher.js";
import { evaluateConditions } from "./condition-evaluator.js";
import { executeAutomationActions, type AutomationRunSummary } from "../executor/executor.js";

export interface AutomationRunOutcome {
  ruleId: string;
  ruleName?: string;
  status: AutomationRunSummary["status"];
  conditionsMatched: boolean;
  runId?: string;
  actions?: AutomationRunSummary["actions"];
  error?: string;
}

export async function runAutomationEngine(event: DomainEvent): Promise<AutomationRunOutcome[]> {
  const rules = await loadMatchingRulesForEvent(event);
  if (!rules.length) {
    logger.info(`[automation][engine] no rules matched for ${event.type}`);
    return [];
  }

  const evaluationContext = buildEvaluationContext(event);
  const outcomes: AutomationRunOutcome[] = [];

  for (const rule of rules) {
    let conditionsMatched = false;
    try {
      conditionsMatched = evaluateConditions(rule.conditionConfig, evaluationContext);
      logger.info(
        `[automation][engine] rule ${rule.id} conditions ${conditionsMatched ? "passed" : "filtered"}`,
      );
    } catch (err) {
      logger.error(`[automation][engine] rule ${rule.id} condition evaluation failed`, { error: err });
      continue;
    }

    if (!conditionsMatched) {
      continue;
    }

    try {
      const runSummary = await executeAutomationActions({ rule, event });
      logger.info(
        `[automation][engine] run completed for rule ${rule.id} status ${runSummary.status}`,
      );
      outcomes.push({
        ruleId: rule.id,
        ruleName: rule.name,
        status: runSummary.status,
        conditionsMatched,
        actions: runSummary.actions,
        runId: runSummary.runId,
        error: runSummary.error,
      });
    } catch (err) {
      logger.error(`[automation][engine] executor failed for rule ${rule.id}`, { error: err });
    }
  }

  return outcomes;
}

function buildEvaluationContext(event: DomainEvent): Record<string, unknown> {
  const payload = toRecord(event.payload);
  const meta = event.meta ?? {};
  return { ...payload, ...meta, payload, meta };
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return { value };
}
