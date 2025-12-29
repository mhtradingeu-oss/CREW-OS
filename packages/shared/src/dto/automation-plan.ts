
// Canonical, immutable contracts for Automation Planner (Phase C.2)
// PLAN-ONLY — no execution, no side effects

import type { AutomationEvent, ConditionEvalResult } from "./automation.js";

export type ActionPlanItem = {
  type: string;
  params?: Record<string, unknown>;
  mode: 'PLAN_ONLY';
};

export type AutomationPlan = {
  event: AutomationEvent;

  matchedRules: Array<{
    ruleId: string;
    versionId: string;
    ruleName: string;
    priority: number;

    condition: ConditionEvalResult;

    plannedActions: ActionPlanItem[];
  }>;

  meta: {
    evaluatedAt: string; // ISO string
    engine: 'json-logic';
    mode: 'PLAN_ONLY';
  };
};
