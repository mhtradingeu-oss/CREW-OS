import { z } from "zod";
import type { RulesLogic } from "json-logic-js";

/**
 * ===============================
 * Automation Core Event Types
 * ===============================
 */

export type AutomationEvent = {
  name: string;
  occurredAt: string; // ISO string
  tenantId: string;
  brandId?: string;
  actorUserId?: string;
  correlationId?: string;
  payload: unknown;
};

/**
 * ===============================
 * Conditions
 * ===============================
 */

export type AutomationCondition = {
  kind: "json-logic";
  config: RulesLogic;
};

/**
 * ===============================
 * Policy / Gate Errors
 * ===============================
 */

export const PolicyViolationSchema = z.object({
  code: z.string(),
  message: z.string(),
  path: z.string().optional(),
  details: z.any().optional(),
});

export const AutomationGateErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.array(PolicyViolationSchema).optional(),
});

/**
 * ===============================
 * Rule Lifecycle
 * ===============================
 */

export const AutomationRuleLifecycleState = z.enum([
  "DRAFT",
  "REVIEW",
  "ACTIVE",
  "PAUSED",
  "ARCHIVED",
]);

export const AutomationRuleBaseSchema = z.object({
  id: z.string().cuid().optional(),
  brandId: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  state: AutomationRuleLifecycleState.optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  createdById: z.string().optional().nullable(),
  updatedById: z.string().optional().nullable(),
  lastRunAt: z.string().datetime().optional().nullable(),
  lastRunStatus: z.string().optional().nullable(),
});

export const AutomationRuleVersionSchema = z.object({
  id: z.string().cuid().optional(),
  ruleId: z.string().cuid(),
  versionNumber: z.number().int().min(1),
  triggerEvent: z.string(),
  conditionConfigJson: z.any(),
  actionsConfigJson: z.any(),
  metaSnapshotJson: z.any().optional(),
  createdAt: z.string().datetime().optional(),
  createdById: z.string().optional().nullable(),
  state: AutomationRuleLifecycleState.optional(),
});

/**
 * ===============================
 * Runs
 * ===============================
 */

export const AutomationRunStatus = z.enum([
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "PARTIAL",
  "SKIPPED",
]);

export const AutomationRunSchema = z.object({
  id: z.string().cuid().optional(),
  ruleId: z.string().cuid(),
  ruleVersionId: z.string().cuid(),
  eventName: z.string(),
  eventId: z.string().optional().nullable(),
  status: AutomationRunStatus.optional(),
  startedAt: z.string().datetime().optional().nullable(),
  finishedAt: z.string().datetime().optional().nullable(),
  summaryJson: z.any().optional(),
  errorJson: z.any().optional(),
});

/**
 * ===============================
 * Action Runs
 * ===============================
 */

export const AutomationActionRunStatus = z.enum([
  "PENDING",
  "RUNNING",
  "SUCCESS",
  "FAILED",
  "SKIPPED",
  "RETRYING",
]);

export const AutomationActionRunSchema = z.object({
  id: z.string().cuid().optional(),
  runId: z.string().cuid(),
  actionIndex: z.number().int(),
  actionType: z.string(),
  status: AutomationActionRunStatus.optional(),
  attemptCount: z.number().int().optional(),
  nextAttemptAt: z.string().datetime().optional().nullable(),
  dedupKey: z.string().optional(),
  actionConfigJson: z.any(),
  resultJson: z.any().optional(),
  errorJson: z.any().optional(),
});

/**
 * ===============================
 * Inferred Types
 * ===============================
 */

export type AutomationRule = z.infer<typeof AutomationRuleBaseSchema>;
export type AutomationRuleVersion = z.infer<typeof AutomationRuleVersionSchema>;
export type AutomationRun = z.infer<typeof AutomationRunSchema>;
export type AutomationActionRun = z.infer<typeof AutomationActionRunSchema>;
export type ConditionEvalResult = {
  passed: boolean;
  reason?: string;
};