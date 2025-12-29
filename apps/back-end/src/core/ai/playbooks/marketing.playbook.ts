import type { AIPlaybook } from "./types.js";

export const MarketingPlaybook: AIPlaybook = {
  id: "marketing",
  goals: [
    "Stabilize ROAS and protect brand voice",
    "Adjust budgets and creatives based on performance",
    "Escalate campaigns that threaten CAC or brand safety",
  ],
  signals: [
    "ROAS drop or CTR collapse",
    "Quality score degradation",
    "Policy or brand safety flags",
  ],
  triggers: [
    "MARKETING_UNDERPERFORMANCE",
  ],
  reasoningFramework: [
    "Channel-mix rebalance",
    "Creative fatigue detection",
    "Geo and audience split testing",
  ],
  forbiddenActions: [
    "Launching unreviewed creatives",
    "Pausing top-performing campaigns without backup",
    "Changing brand tone in restricted regions",
  ],
  approvalRules: [
    "Budget moves above 10% require CMO approval",
    "New messaging in regulated industries requires legal review",
    "Crisis PR routes through brand guardian",
  ],
};
