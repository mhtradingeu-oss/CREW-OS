import type {
  AutomationEvent,
  AutomationRuleMatch,
  AutomationRuntimeResult,
  AutomationPlan,
  AutomationCondition,
  ConditionEvalResult,
} from "./types.js";

import { JsonLogicConditionEvaluator } from "../conditions/json-logic-evaluator.js";

export class AutomationRuntime {
  private readonly conditionEvaluator = new JsonLogicConditionEvaluator();

  /**
   * Phase C Runtime
   * PLAN-ONLY — no execution, no side effects
   */
  async run(
    event: AutomationEvent,
    matchedRules: AutomationRuleMatch[]
  ): Promise<AutomationRuntimeResult> {
    const plan: AutomationPlan = {
      event,
      matchedRules: matchedRules.map(rule => {
        // 1️⃣ Evaluate conditions
        const conditionResults: ConditionEvalResult[] =
          this.conditionEvaluator.evaluateConditions(
            rule.conditions as AutomationCondition[],
            event
          );

        const allPassed = conditionResults.every(r => r.passed);

        // 2️⃣ Extract first failure reason (if any)
        const failed = conditionResults.find(r => !r.passed);
        const reason = failed?.reason;

        return {
          ruleId: rule.ruleId,
          versionId: rule.versionId,
          ruleName: rule.ruleName,
          priority: rule.priority,

          condition: {
            passed: allPassed,
            reason,
          },

          plannedActions: allPassed
            ? rule.actions.map(action => ({
                type: action.type,
                params: action.params,
                mode: "PLAN_ONLY",
              }))
            : [],
        };
      }),
    };

    return {
      plan,
      auditId: `audit_${Date.now()}`,
    };
  }
}
