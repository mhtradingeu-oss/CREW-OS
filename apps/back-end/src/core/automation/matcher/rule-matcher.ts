import { AutomationEvent } from '../events/event-types.js';
import { AutomationRuleMatch } from '../runtime/types.js';

export class RuleMatcher {
  async match(event: AutomationEvent): Promise<AutomationRuleMatch[]> {
    // Phase C – stub (no DB)
    return [
      {
        ruleId: 'rule-demo-1',
        versionId: 'v1',
        ruleName: 'Demo Order Created Rule',
        priority: 100,
        conditions: [],
        actions: [],
      },
    ].filter(r => event.name === 'order.created');
  }
}
