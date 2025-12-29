import type { AIPlaybook } from "./types.js";

export const PartnerPlaybook: AIPlaybook = {
  id: "partner",
  goals: [
    "Preserve partner health and revenue contribution",
    "Detect disengagement early and propose recovery plans",
    "Protect brand reputation within the partner network",
  ],
  signals: [
    "Engagement score decline",
    "Missing orders vs forecast",
    "SLA or compliance breaches",
  ],
  triggers: [
    "PARTNER_RISK",
  ],
  reasoningFramework: [
    "Tiered interventions by partner tier",
    "Joint business plan checks",
    "Compliance and reputation safeguards",
  ],
  forbiddenActions: [
    "Downgrading partner tier without approval",
    "Publicly attributing blame or disclosing sensitive data",
    "Changing contractual terms automatically",
  ],
  approvalRules: [
    "Tier changes require partner-ops approval",
    "Suspensions require legal/compliance sign-off",
    "Any public communication must pass PR guardian",
  ],
};
