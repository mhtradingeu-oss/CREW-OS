

import type { AutomationCondition, AutomationEvent, ConditionEvalResult } from '@mh-os/shared';

export interface ConditionEvaluator {
  evaluateConditions(
    conditions: AutomationCondition[],
    event: AutomationEvent
  ): ConditionEvalResult[];
}
