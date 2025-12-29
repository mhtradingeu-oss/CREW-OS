import type { PlaybookId } from "../playbooks/types.js";
import type { PipelineActor, PipelineResult } from "../pipeline/pipeline-types.js";

export type AutonomyIssueType =
  | "PRICING_ANOMALY"
  | "MARGIN_DROP"
  | "COMPETITOR_PRESSURE"
  | "INVENTORY_RISK"
  | "CRM_CHURN_RISK"
  | "MARKETING_UNDERPERFORMANCE"
  | "PARTNER_RISK"
  | "FINANCE_RISK"
  | "OPERATIONS_ALERT"
  | "SUPPORT_ALERT";

export type AutonomySeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AutonomySafetyPath = "SAFE" | "HIGH_RISK";

export type AutonomyDetection = {
  id: string;
  type: AutonomyIssueType;
  severity: AutonomySeverity;
  detectedAt: string;
  details: Record<string, unknown>;
  requiredContexts: string[];
};

export type AutonomyActionStep = {
  id: string;
  goal: string;
  engine: AutonomyTaskEngine;
  agentId: string;
  inputs?: Record<string, unknown>;
  approvalRequired?: boolean;
  dependsOn?: string[];
  safetyPath?: AutonomySafetyPath;
};

export type AutonomyTaskEngine =
  | "PRICING_ENGINE"
  | "COMPETITOR_ENGINE"
  | "INVENTORY_ENGINE"
  | "CRM_ENGINE"
  | "MARKETING_ENGINE"
  | "PARTNER_ENGINE"
  | "FINANCE_ENGINE"
  | "OPERATIONS_ENGINE"
  | "SUPPORT_ENGINE"
  | "AUTONOMY_ENGINE"
  | "TASK_PLANNER"
  | "GOVERNANCE_ENGINE";

export type AutonomyScenario = {
  name: string;
  issueTypes: AutonomyIssueType[];
  inputSignals: string[];
  engines: AutonomyTaskEngine[];
  playbook: PlaybookId;
  safeActions: AutonomyActionStep[];
  highRiskActions: AutonomyActionStep[];
  defaultRisk: AutonomySeverity;
  approvalRequired?: boolean;
};

export type AutonomyGovernanceCheck = {
  safeToProceed: boolean;
  violations: string[];
  requiredApprovals: string[];
  notes?: string;
};

export type AutonomyTaskStatus =
  | "PENDING"
  | "QUEUED"
  | "RUNNING"
  | "COMPLETED"
  | "BLOCKED"
  | "REJECTED";

export type AutonomyTask = {
  taskId: string;
  agentId: string;
  goal: string;
  contexts: string[];
  engine: AutonomyTaskEngine;
  requiresApproval: boolean;
  inputs: Record<string, unknown>;
  dependencies?: string[];
  createdAt: string;
  updatedAt?: string;
  status: AutonomyTaskStatus;
  sourceIssueId?: string;
  risk: AutonomySeverity;
  governance?: AutonomyGovernanceCheck;
  actor?: PipelineActor;
  result?: AutonomyExecutionResult;
  scenario?: string;
  playbookId?: PlaybookId;
  safetyPath?: AutonomySafetyPath;
  actionId?: string;
};

export type AutonomyExecutionResult = {
  success: boolean;
  taskId: string;
  engineOutput: unknown;
  nextAction?: string | null;
  pipeline?: PipelineResult | null;
  contexts?: Record<string, unknown>;
};

export type AutonomyPlan = {
  tasks: AutonomyTask[];
  createdAt: string;
  fromIssues: AutonomyDetection[];
  scenariosUsed?: string[];
  playbooksUsed?: PlaybookId[];
};

export type AutonomyStatus = {
  lastRunAt?: string;
  queued: AutonomyTask[];
  running: AutonomyTask[];
  completed: AutonomyTask[];
  blocked: AutonomyTask[];
  pendingApproval: AutonomyTask[];
  lastDetections?: AutonomyDetection[];
  lastPlan?: AutonomyPlan;
  globalAutonomyEnabled: boolean;
  totalPending: number;
  totalExecuted: number;
  totalRejected: number;
};

export type AutonomyCycleResult = {
  detections: AutonomyDetection[];
  planned: AutonomyTask[];
  executed: AutonomyExecutionResult[];
  queued: AutonomyTask[];
  blocked: AutonomyTask[];
  pendingApproval: AutonomyTask[];
  playbooksUsed?: PlaybookId[];
  scenariosUsed?: string[];
};
