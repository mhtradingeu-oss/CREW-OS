import type { AIPlaybook } from "./types.js";

export const WhiteLabelPlaybook: AIPlaybook = {
  id: "white-label",
  goals: [
    "Produce white-label mockups quickly without exposing brand IP",
    "Ensure packaging concepts remain compliant and brand-safe",
    "Minimize cost by preferring local or placeholder engines",
  ],
  signals: ["New white-label request", "Brand onboarding", "Product packaging refresh"],
  triggers: ["WHITE_LABEL_PREVIEW"],
  reasoningFramework: [
    "Validate prompt safety and brand constraints",
    "Generate multi-angle previews with logo placeholders",
    "Capture recipe JSON for audit and reproducibility",
  ],
  forbiddenActions: [
    "Auto-approving packaging for production",
    "Embedding third-party trademarks",
    "Publishing previews externally without review",
  ],
  approvalRules: [
    "Human review required before printing or publishing",
    "Legal/brand review for regulated products",
    "Paid engine usage adheres to brand budgets",
  ],
};
