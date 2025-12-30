import type { AutomationExecutionResult, AutomationIncidentStatus, AutomationIncidentSeverity } from "@prisma/client";

export type BrandSummary = {
  id?: string;
  name?: string;
  tenantId?: string;
};

export interface TimelineItemBase {
  id: string;
  timestamp: Date;
  brand?: BrandSummary;
  tenantId?: string;
  actor?: string;
  actorType?: "user" | "system";
  status?: string;
  environment: string;
  snapshotHash?: string | null;
}

export interface SnapshotTimelineItem extends TimelineItemBase {
  eventType?: string;
  productId?: string;
  source?: string;
}

export interface SuggestionTimelineItem extends TimelineItemBase {
  correlationId?: string;
  suggestionType?: string;
  riskLevel?: string;
}

export interface ApprovalTimelineItem extends TimelineItemBase {
  suggestionId?: string | null;
  correlationId?: string;
  approvedById?: string | null;
}

export interface ExecutionTimelineItem extends TimelineItemBase {
  executionId: string;
  approvalDecisionId: string;
  result: AutomationExecutionResult;
  actionType?: string;
  executedById: string;
  correlationId?: string;
}

export interface IncidentTimelineItem extends TimelineItemBase {
  incidentId: string;
  incidentType?: string;
  severity?: AutomationIncidentSeverity;
  detectedBy?: string;
  detectedById?: string;
  description?: string | null;
  incidentStatus?: AutomationIncidentStatus;
  correlationId?: string;
  executionId?: string;
}

export interface RollbackTimelineItem extends TimelineItemBase {
  rollbackId: string;
  executionId: string;
  incidentId: string;
  reason: string;
  snapshotReference: string;
  scopeDescription: string;
}

export interface PaginatedTimeline<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApprovalDetail {
  id: string;
  status: string;
  snapshotHash: string;
  environment: string;
  approvedBy?: { id: string; email?: string };
  approvedAt?: Date | null;
  expiresAt?: Date | null;
  revokedAt?: Date | null;
  brand?: BrandSummary;
  tenantId?: string;
  correlationId?: string;
  reason?: string | null;
}

export interface GuardCheckSummary {
  approvalStatus: string;
  snapshotHashMatched: boolean;
  suggestionMatched: boolean;
  environmentMatched: boolean;
  expired: boolean;
}

export interface KillSwitchSummary {
  brandEnabled: boolean;
  brandReason?: string;
  approvalKillSwitch?: KillSwitchRecord;
  executionKillSwitch?: KillSwitchRecord;
}

export interface KillSwitchRecord {
  id: string;
  reason: string;
  targetType: string;
  scope: string;
  incidentId?: string;
}

export interface ExecutionDetail {
  executionId: string;
  status: AutomationExecutionResult;
  snapshotHash: string;
  environment: string;
  executedAt: Date;
  executedBy: { id: string; email?: string };
  actionType: string;
  actionPayloadJson?: unknown;
  metadataJson?: unknown;
  errorCode?: string | null;
  errorMessage?: string | null;
  correlationId?: string;
  guardChecks: GuardCheckSummary;
  killSwitch: KillSwitchSummary;
  rollback?: { id: string; status: string } | null;
  brand?: BrandSummary;
  tenantId?: string;
}
