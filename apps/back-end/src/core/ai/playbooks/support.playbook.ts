import type { AIPlaybook } from "./types.js";

export const SupportPlaybook: AIPlaybook = {
  id: "support",
  goals: [
    "Resolve critical tickets fast without breaking SLAs",
    "Stabilize customer sentiment during crises",
    "Ensure accurate handoffs to humans when needed",
  ],
  signals: [
    "Escalated or urgent tickets",
    "Spike in negative sentiment or CSAT",
    "Repeated failures on same issue",
  ],
  triggers: [
    "SUPPORT_ALERT",
  ],
  reasoningFramework: [
    "Severity triage with impact scoring",
    "Play selection: contain, resolve, or escalate",
    "Communication templates with compliance checks",
  ],
  forbiddenActions: [
    "Closing tickets without customer confirmation",
    "Issuing refunds or credits automatically",
    "Sharing sensitive data in responses",
  ],
  approvalRules: [
    "Refunds require finance approval",
    "Legal or privacy topics require compliance approval",
    "Public status updates must be reviewed by PR guardian",
  ],
};
