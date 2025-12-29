import { z } from "zod";

export const createFirewallRuleSchema = z.object({
  name: z.string(),
  matcherType: z.string().default("contains"),
  matcherValue: z.string(),
  action: z.enum(["ALLOW", "BLOCK", "SANITIZE"]),
  reason: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  tags: z.string().optional(),
});

export const createSafetyConstraintSchema = z.object({
  code: z.string(),
  scope: z.string().optional(),
  description: z.string().optional(),
  ruleJson: z.record(z.any()).optional(),
  allowedActions: z.array(z.string()).optional(),
  restrictedDomains: z.array(z.string()).optional(),
  riskScore: z.number().optional(),
});

export const createBannedActionSchema = z.object({
  code: z.string(),
  description: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
  scope: z.string().optional(),
  mitigation: z.string().optional(),
});

export const oversightReviewSchema = z.object({
  runId: z.string().optional(),
  agentName: z.string().optional(),
  namespace: z.string().optional(),
  decision: z.string(),
  notes: z.string().optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

export const redTeamSchema = z.object({
  runId: z.string().optional(),
  scenario: z.string(),
  outcome: z.string().optional(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("HIGH"),
});

export const testPromptSchema = z.object({
  prompt: z.string(),
  mode: z.string().optional(),
  context: z.record(z.any()).optional(),
});
