import type { AIPlaybook } from "./types.js";

export const CrmPlaybook: AIPlaybook = {
  id: "crm",
  goals: [
    "Reduce churn risk with timely save motions",
    "Personalize outreach while respecting consent",
    "Protect margin while offering incentives",
  ],
  signals: [
    "Lead score collapse",
    "Dormant accounts and inactivity",
    "Negative CSAT or ticket escalation",
  ],
  triggers: [
    "CRM_CHURN_RISK",
    "SUPPORT_ALERT",
  ],
  reasoningFramework: [
    "Propensity-to-churn with play selection",
    "Offer ladder with margin guardrails",
    "Channel selection honoring consent and opt-outs",
  ],
  forbiddenActions: [
    "Sending outreach to contacts without consent",
    "Issuing discounts above allowed range",
    "Overwriting account owner assignments",
  ],
  approvalRules: [
    "Discounts above 15% require sales leadership approval",
    "Escalations to legal must notify CSM lead",
    "Bulk outreach requires marketing compliance review",
  ],
};
