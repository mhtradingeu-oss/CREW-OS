import type { AIPlaybook } from "./types.js";

export const BIAnalyticsPlaybook: AIPlaybook = {
  id: "bi-analytics",
  goals: [
    "Deliver trustworthy insights with minimal latency",
    "Detect anomalies across business metrics",
    "Route insights to the right owners with context",
  ],
  signals: [
    "Metric deviation vs baseline",
    "Data quality degradation",
    "Missing or stale dashboards",
  ],
  triggers: [
    "FINANCE_RISK",
    "MARKETING_UNDERPERFORMANCE",
    "OPERATIONS_ALERT",
  ],
  reasoningFramework: [
    "Time-series anomaly detection",
    "Segmentation to isolate root causes",
    "Confidence scoring before surfacing",
  ],
  forbiddenActions: [
    "Publishing insights without confidence threshold",
    "Exposing PII in dashboards",
    "Auto-modifying source schemas",
  ],
  approvalRules: [
    "Executive dashboards require CSO/CFO acknowledgement",
    "Low-confidence insights must be labeled and routed for review",
    "Schema or metric definition changes need data governance approval",
  ],
};
