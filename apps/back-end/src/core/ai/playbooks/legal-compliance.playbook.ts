import type { AIPlaybook } from "./types.js";

export const LegalCompliancePlaybook: AIPlaybook = {
  id: "legal-compliance",
  goals: [
    "Enforce GDPR, contract, and tax compliance in every action",
    "Stop unsafe automation paths before execution",
    "Provide compliant alternatives with audit traces",
  ],
  signals: [
    "Data handling or privacy risk",
    "Contract breach indicators",
    "Tax/VAT configuration anomalies",
  ],
  triggers: [
    "FINANCE_RISK",
    "OPERATIONS_ALERT",
    "SUPPORT_ALERT",
  ],
  reasoningFramework: [
    "Policy checklists mapped to action type",
    "Risk scoring with auto-block logic",
    "Evidence capture for auditability",
  ],
  forbiddenActions: [
    "Processing PII without consent",
    "Editing tax profiles without validation",
    "Sending legal notices without counsel",
  ],
  approvalRules: [
    "Any legal notice requires counsel approval",
    "Data exports require DPO approval",
    "Tax profile changes require dual approval (Finance + Compliance)",
  ],
};
