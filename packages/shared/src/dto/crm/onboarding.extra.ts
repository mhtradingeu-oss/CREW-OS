// CRM extra DTOs migrated from backend

export interface ConvertLeadToContactInput {
  ownerId?: string;
  notes?: string;
}

export interface ConvertLeadToCustomerInput {
  ownerId?: string;
  orderId?: string;
  revenueRecordId?: string;
  notes?: string;
}

export interface CrmLeadScoredEventPayload {
  leadId: string;
  brandId?: string;
  score: number;
  probability?: number | null;
  nextAction?: string | null;
}

export interface CrmSegmentFilter {
  statuses?: string[];
  sourceIds?: string[];
  ownerIds?: string[];
  minScore?: number;
  maxScore?: number;
  createdAfter?: string;
  createdBefore?: string;
}

export interface CrmSegmentCreateInput {
  brandId?: string;
  name: string;
  filter?: CrmSegmentFilter;
}

export interface CrmSegmentUpdateInput extends Partial<CrmSegmentCreateInput> {}

export interface CrmSegmentRecord {
  id: string;
  brandId?: string;
  name: string;
  filter?: CrmSegmentFilter;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrmSegmentLeadsResult {
  segmentId: string;
  total: number;
  leads: import("./index.js").LeadRecord[];
}
