import { z } from "zod";

export const runAutonomyCycleSchema = z.object({
  brandId: z.string().optional(),
  tenantId: z.string().optional(),
  autoExecute: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  includeEmbeddings: z.boolean().optional(),
});

export const pendingAutonomyQuerySchema = z.object({
  severity: z.enum(["low", "medium", "high"]).optional(),
  brandId: z.string().optional(),
  type: z.string().optional(),
  limit: z.coerce.number().optional(),
  offset: z.coerce.number().optional(),
});

export const autonomyConfigSchema = z.object({
  globalAutonomyEnabled: z.boolean().optional(),
});
