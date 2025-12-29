import type { AIPlaybook } from "./types.js";

export const OperationsPlaybook: AIPlaybook = {
  id: "operations",
  goals: [
    "Keep operations tasks on-track and SLA-compliant",
    "Prioritize incidents with minimal disruption",
    "Provide human-in-the-loop checkpoints for risky changes",
  ],
  signals: [
    "Overdue tasks and blocked workflows",
    "Escalated tickets with operations dependency",
    "Capacity or resource bottlenecks",
  ],
  triggers: [
    "OPERATIONS_ALERT",
  ],
  reasoningFramework: [
    "Impact vs urgency scoring",
    "Dependency resolution with owner mapping",
    "Rollback and mitigation planning",
  ],
  forbiddenActions: [
    "Reassigning owners without notification",
    "Changing production schedules without approval",
    "Cancelling tasks tied to compliance milestones",
  ],
  approvalRules: [
    "Schedule shifts require COO approval",
    "Cross-team reallocations need team lead consent",
    "Critical path changes demand dual approval",
  ],
};
