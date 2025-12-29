
import type { AutomationCondition, ConditionEvalResult, AutomationEvent } from './types.js';

export class RuleEvaluator {
  evaluateAll(
    event: AutomationEvent,
    conditions: AutomationCondition[]
  ): ConditionEvalResult {
    if (!conditions || conditions.length === 0) {
      const result: ConditionEvalResult = { passed: true };
      return result;
    }

    for (const c of conditions) {
      if (c.kind !== 'json-logic') {
        const result: ConditionEvalResult = {
          passed: false,
          reason: 'UNSUPPORTED_CONDITION_KIND',
        };
        return result;
      }

      if (c.config && Object.keys(c.config as object).length > 0) {
        const result: ConditionEvalResult = {
          passed: false,
          reason: 'CONDITION_ENGINE_NOT_IMPLEMENTED',
        };
        return result;
      }
    }

    const result: ConditionEvalResult = { passed: true };
    return result;
  }
}
