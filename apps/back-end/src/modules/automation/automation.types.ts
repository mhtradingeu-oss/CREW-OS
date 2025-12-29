// --- Event payload type for automation events ---
// Canonical event types are imported from @mh-os/shared
// --- Structured error/violation types for governance gates ---
export interface PolicyViolation {
  code: string;
  message: string;
  path?: string;
  details?: any;
}

export interface AutomationGateError {
  code: string;
  message: string;
  details?: PolicyViolation[];
}

import type {
  AutomationRule,
  AutomationRuleVersion,
  AutomationRun,
  AutomationActionRun,
} from '@mh-os/shared';

export type { AutomationRule, AutomationRuleVersion, AutomationRun, AutomationActionRun };

export type ConditionOperator = "eq" | "neq" | "gt" | "lt" | "includes";

export interface ConditionConfig {
  path: string;
  op: ConditionOperator;
  value?: unknown;
}

export interface ActionConfig {
  type: string;
  params?: Record<string, unknown>;
}

export interface CreateAutomationRuleInput {
  name: string;
  description?: string;
  brandId?: string;
  createdById?: string;
}

export interface CreateAutomationRuleVersionInput {
  ruleId: string;
  versionNumber: number;
  triggerEvent: string;
  conditionConfigJson: any;
  actionsConfigJson: any;
  metaSnapshotJson?: any;
  createdById?: string;
}

export interface CreateAutomationRunInput {
  ruleId: string;
  ruleVersionId: string;
  eventName: string;
  eventId?: string;
  triggerEventJson?: any;
  conditionsJson?: any;
  actionsJson?: any;
  ruleMetaJson?: any;
  dedupKey?: string;
}

export interface CreateAutomationActionRunInput {
  runId: string;
  actionIndex: number;
  actionType: string;
  actionConfigJson: any;
  dedupKey?: string;
}
