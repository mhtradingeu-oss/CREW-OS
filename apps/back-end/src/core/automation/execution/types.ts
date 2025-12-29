export type AutomationExecutionActionContext = Readonly<{
  executionId: string;
  correlationId?: string;
  approvalDecisionId: string;
  suggestionId: string;
  snapshotHash: string;
  environment: string;
  executedById: string;
}>;

export type AutomationExecutionActionResult = Readonly<{
  data: Record<string, unknown>;
}>;
