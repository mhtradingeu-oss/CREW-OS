import { z } from "zod";

const executeAiSuggestionActionSchema = z.object({
  type: z.literal("executeAiSuggestionPlan"),
  payload: z.record(z.unknown()).optional(),
});

export const executeAiSuggestionRequestSchema = z.object({
  approvalDecisionId: z.string().min(1),
  snapshotHash: z.string().min(1),
  action: executeAiSuggestionActionSchema,
  correlationId: z.string().optional(),
});

export type ExecuteAiSuggestionRequest = z.infer<typeof executeAiSuggestionRequestSchema>;
