import type { AIPlaybook } from "./types.js";

export const MediaPlaybook: AIPlaybook = {
  id: "media",
  goals: [
    "Generate safe, on-brand media with clear auditability",
    "Prefer local/free engines unless paid keys are configured",
    "Keep assets in draft for human approval",
  ],
  signals: [
    "New campaign or product launch",
    "Need for refreshed brand visuals",
    "Budget alerts from AI Monitoring",
  ],
  triggers: ["MEDIA_REQUESTED", "MEDIA_REFRESH"],
  reasoningFramework: [
    "Check safety and brand guardrails",
    "Pick engine with lowest cost that meets quality",
    "Fallback to placeholders when paid engines unavailable",
  ],
  forbiddenActions: [
    "Publishing media to public channels automatically",
    "Using third-party logos or likeness without permission",
    "Generating NSFW or violent content",
  ],
  approvalRules: [
    "All media assets require human approval before distribution",
    "Paid engine usage must respect agent budgets",
    "Sensitive brand domains require brand-owner approval",
  ],
};
