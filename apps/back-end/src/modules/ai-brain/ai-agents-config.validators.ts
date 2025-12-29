import { z } from "zod";

export const agentConfigQuerySchema = z.object({
  brandId: z.string().optional(),
});

export const updateAgentConfigSchema = z.object({
  autonomyLevel: z.enum(["AUTO_DISABLED", "AUTO_LOW_RISK_ONLY", "AUTO_FULL"]).optional(),
  maxRiskLevel: z.enum(["low", "medium", "high"]).optional(),
  enabledContexts: z.array(z.string()).optional(),
  notes: z.string().optional(),
  brandId: z.string().optional(),
});
