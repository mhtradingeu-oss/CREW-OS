import type { AIPlaybook } from "./types.js";

export const CompetitorPlaybook: AIPlaybook = {
  id: "competitor",
  goals: [
    "Detect and counter competitor pressure early",
    "Recommend market moves aligned with margin targets",
    "Escalate risky competitive plays with approvals",
  ],
  signals: [
    "Aggressive competitor undercutting",
    "Share of voice drop on priority SKUs",
    "Lost bids or high refund signals tied to rivals",
  ],
  triggers: [
    "COMPETITOR_PRESSURE",
    "PRICING_ANOMALY",
  ],
  reasoningFramework: [
    "Win-loss analysis with margin guardrails",
    "Channel prioritization vs competitor footprint",
    "Scenario simulation: hold, match, or differentiate",
  ],
  forbiddenActions: [
    "Entering price wars on low-margin SKUs without sponsor approval",
    "Publishing competitor data externally",
    "Changing strategic positioning messaging without CMO/CSO sign-off",
  ],
  approvalRules: [
    "Price responses that reduce margin >3% require finance approval",
    "Brand repositioning moves require CSO approval",
    "Any public-facing statement must route through PR guardian",
  ],
};
