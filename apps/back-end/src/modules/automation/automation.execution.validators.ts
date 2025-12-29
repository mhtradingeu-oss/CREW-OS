import { z } from "zod";
import { automationExecutionActionSchema } from "../../core/automation/execution/actions.js";

export const executeAutomationSchema = z.object({
  approvalDecisionId: z.string().min(1),
  suggestionId: z.string().min(1),
  snapshotHash: z.string().min(1),
  action: automationExecutionActionSchema,
  correlationId: z.string().optional(),
});
