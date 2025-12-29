import type { AIPlaybook } from "./types.js";

export const StrategyPlaybook: AIPlaybook = {
  id: "strategy",
  goals: [
    "Align actions to OKRs and long-term positioning",
    "Highlight deviations early with corrective options",
    "Keep governance and risk views attached to strategy moves",
  ],
  signals: [
    "OKR deviation or missed milestones",
    "Market positioning drift",
    "Cross-functional conflicts between roadmaps",
  ],
  triggers: [
    "OPERATIONS_ALERT",
  ],
  reasoningFramework: [
    "OKR health scoring with root-cause mapping",
    "Scenario planning across time horizons",
    "Risk and dependency reconciliation",
  ],
  forbiddenActions: [
    "Changing company vision statements automatically",
    "Publishing strategy updates without CSO approval",
    "Altering board-level metrics or baselines",
  ],
  approvalRules: [
    "Strategic pivots require CSO and CEO approval",
    "Any public-facing update must route through PR guardian",
    "Cross-module OKR changes need owning lead consent",
  ],
};
