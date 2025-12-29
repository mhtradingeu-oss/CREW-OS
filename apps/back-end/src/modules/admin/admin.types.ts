export interface PolicyRecord {
  id: string;
  name: string;
  rulesJson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyInput {
  name: string;
  rulesJson?: string;
}

export interface UpdatePolicyInput extends Partial<CreatePolicyInput> {}

export interface AIRestrictionRecord {
  id: string;
  name: string;
  rulesJson?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIRestrictionInput {
  name: string;
  rulesJson?: string;
}

export interface UpdateAIRestrictionInput extends Partial<CreateAIRestrictionInput> {}

export interface AuditLogRecord {
  id: string;
  userId?: string | null;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

export interface AdminAISummaryInput {
  brandId: string;
  entityType: string;
  entityId?: string | null;
  context?: string;
  tenantId?: string;
}

export interface AdminAISummaryResult {
  id: string;
  summary: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminEventPayload {
  brandId?: string;
  entityId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
