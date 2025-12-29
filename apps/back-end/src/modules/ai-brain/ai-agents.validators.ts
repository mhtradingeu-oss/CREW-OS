import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1),
  osScope: z.string().optional(),
  configJson: z.record(z.string(), z.unknown()).optional(),
  brandId: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export const runAgentSchema = z.object({
  agentId: z.string().min(1),
  task: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  includeEmbeddings: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});
