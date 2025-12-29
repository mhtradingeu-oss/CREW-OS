import { ActionPlanItem, AutomationAction } from './types.js';

export class ActionPlanner {
  plan(actions: AutomationAction[]): ActionPlanItem[] {
    if (!actions || actions.length === 0) return [];

    return actions.map((a) => ({
      type: a.type,
      params: a.params ?? {},
      mode: 'PLAN_ONLY',
    }));
  }
}
