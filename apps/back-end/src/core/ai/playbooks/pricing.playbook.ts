import type { AIPlaybook } from "./types.js";

export const PricingPlaybook: AIPlaybook = {
  id: "pricing",
  goals: [
    "Protect margin while staying price-competitive",
    "Automate tactical price moves with governance checkpoints",
    "Surface human approvals for high-risk price changes",
  ],
  signals: [
    "Competitor price drops and undercutting",
    "Margin erosion across channels",
    "Inventory velocity and elasticity shifts",
    "ROAS swings that require price recalibration",
  ],
  triggers: [
    "PRICING_ANOMALY",
    "COMPETITOR_PRESSURE",
    "MARGIN_DROP",
  ],
  reasoningFramework: [
    "Cost-plus vs value-based cross-check per SKU",
    "Elasticity bands mapped to inventory position",
    "Competitor bench with stock availability overlay",
    "Risk score -> approval policy -> execution path",
  ],
  forbiddenActions: [
    "Slash price below configured floor without approval",
    "Change VAT or tax profiles on price pushes",
    "Touch products outside assigned brand scope",
    "Publish live pricing without finance notification",
  ],
  approvalRules: [
    "Net price delta above 5% requires finance approval",
    "Critical severity requires CFO or COO approval",
    "Auto-publish only allowed when safety path is SAFE",
  ],
};
