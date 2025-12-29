export interface CreateMarketingInput {
  brandId?: string;
  channelId?: string;
  name: string;
  objective?: string;
  budget?: number;
  status?: string;
  targetSegmentIds?: string[];
}

export interface UpdateMarketingInput extends Partial<CreateMarketingInput> {}

export interface CampaignRecord {
  id: string;
  brandId?: string;
  channelId?: string;
  name: string;
  objective?: string;
  budget?: number | null;
  status?: string | null;
  targetSegmentIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignAttributionInput {
  leadId?: string;
  customerId?: string;
  source?: string;
}

export interface CampaignAttributionRecord {
  id: string;
  campaignId: string;
  brandId?: string;
  leadId?: string;
  customerId?: string;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignInteractionInput {
  type: string;
  leadId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface CampaignInteractionRecord {
  id: string;
  campaignId: string;
  type: string;
  leadId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingCampaignEventPayload {
  id: string;
  brandId?: string;
  channelId?: string | null;
  status?: string | null;
  targetSegmentIds?: string[];
}

export interface CampaignAttributionEventPayload {
  campaignId: string;
  brandId?: string;
  leadId?: string;
  customerId?: string;
  source?: string;
}

export interface CampaignInteractionEventPayload {
  campaignId: string;
  brandId?: string;
  type: string;
  leadId?: string;
  customerId?: string;
  metadata?: Record<string, unknown>;
}

export interface LeadPreview {
  id: string;
  name?: string;
  email?: string;
  score?: number | null;
  status?: string | null;
}

export interface CampaignSegmentPreview {
  segmentId: string;
  segmentName?: string;
  total: number;
  sample: LeadPreview[];
}

export interface CampaignTargetPreview {
  campaignId: string;
  totalLeads: number;
  segments: CampaignSegmentPreview[];
}
