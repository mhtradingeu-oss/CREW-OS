// Phase-B stub
export type CrmCustomerRecord = any;

// All domain types have been moved to @mh-os/shared. Only UI/View/Props types may remain here.

// Phase-B: CRM contract stubs
export type CrmLeadEventPayload = any;
export type CrmCustomerEventPayload = any;
export type CrmContactEventPayload = any;
export type LeadRecord = any;
export type CreateLeadInput = any;
export type UpdateLeadInput = any;

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
  leads: LeadRecord[];
}
