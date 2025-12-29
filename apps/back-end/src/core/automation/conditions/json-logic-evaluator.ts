// JsonLogic-based ConditionEvaluator implementation (PLAN-ONLY)
// ESM imports only, explicit exports

import { ConditionEvaluator } from './condition-evaluator.js';
import type { AutomationCondition, AutomationEvent, ConditionEvalResult } from '@mh-os/shared';
import jsonLogic, { RulesLogic } from 'json-logic-js';

export class JsonLogicConditionEvaluator implements ConditionEvaluator {
  evaluateConditions(
    conditions: AutomationCondition[],
    event: AutomationEvent
  ): ConditionEvalResult[] {
    return conditions.map((condition) => {
      let passed = false;
      let reason: string | undefined = undefined;
      try {
        // Use config for json-logic
        passed = !!jsonLogic.apply(condition.config as RulesLogic, event);
      } catch (e) {
        reason = e instanceof Error ? e.message : 'Unknown error';
      }
      return {
        passed,
        reason,
      };
    });
  }
}
