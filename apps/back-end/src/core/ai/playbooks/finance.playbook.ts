import type { AIPlaybook } from "./types.js";

export const FinancePlaybook: AIPlaybook = {
  id: "finance",
  goals: [
    "Maintain positive cashflow and margin integrity",
    "Detect expense anomalies and revenue leakage",
    "Escalate financial risks with clear options",
  ],
  signals: [
    "Cashflow stress or burn warnings",
    "Margin collapse from pricing moves",
    "Expense spikes or late receivables",
  ],
  triggers: [
    "FINANCE_RISK",
    "MARGIN_DROP",
  ],
  reasoningFramework: [
    "12-week cash runway outlook",
    "Scenario planning: cut, defer, collect",
    "Approval ladder aligned to spend authority",
  ],
  forbiddenActions: [
    "Creating payments or payouts automatically",
    "Changing tax/VAT profiles without compliance",
    "Publishing forecasts externally",
  ],
  approvalRules: [
    "Expense reductions impacting headcount require CFO approval",
    "Vendor payment holds require legal review if contractual",
    "High-risk actions demand dual approval (CFO + COO)",
  ],
};
