import type { AutomationExecutionAction } from "../../core/automation/execution/actions.js";

export type ExecuteAutomationActionRequest = Readonly<{
  approvalDecisionId: string;
  suggestionId: string;
  snapshotHash: string;
  action: AutomationExecutionAction;
  correlationId?: string;
}>;

export type ExecuteAutomationActionResponse = Readonly<{
  executionId: string;
  approvalDecisionId: string;
  suggestionId: string;
  status: "SUCCESS" | "FAILED";
  actionResult: Record<string, unknown>;
}>;
