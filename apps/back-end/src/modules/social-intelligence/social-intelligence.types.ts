export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SocialMentionRecord {
  id: string;
  brandId?: string | null;
  platform: string;
  author?: string | null;
  keyword?: string | null;
  content?: string | null;
  sentiment?: string | null;
  url?: string | null;
  occurredAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialTrendRecord {
  id: string;
  brandId?: string | null;
  topic: string;
  platform?: string | null;
  score?: number | null;
  trendData?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InfluencerRecord {
  id: string;
  brandId?: string | null;
  handle: string;
  platform: string;
  followers?: number | null;
  engagementRate?: number | null;
  profileUrl?: string | null;
  tags?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompetitorSocialReportRecord {
  id: string;
  brandId?: string | null;
  competitor?: string | null;
  period?: string | null;
  summary?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SocialAISummaryInput {
  brandId: string;
  entityType: "mention" | "trend" | "influencer" | "report";
  entityId?: string | null;
  context?: string;
}

export interface SocialAISummaryResult {
  id: string;
  summary: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInfluencerInput {
  brandId?: string;
  handle: string;
  platform: string;
  followers?: number;
  engagementRate?: number;
  profileUrl?: string;
  tags?: string;
}

export interface UpdateInfluencerInput extends Partial<CreateInfluencerInput> {}

export interface CreateTrendInput {
  brandId?: string;
  topic: string;
  platform?: string;
  score?: number;
  trendData?: Record<string, unknown>;
}

export interface UpdateTrendInput extends Partial<CreateTrendInput> {}

export interface IngestMentionInput {
  brandId: string;
  platform: string;
  author?: string;
  content?: string;
  sentiment?: string;
  url?: string;
  keyword?: string;
  occurredAt?: Date;
}

export interface IngestTrendInput {
  brandId: string;
  topic: string;
  platform?: string;
  score?: number;
  trendData?: Record<string, unknown>;
}

export interface SocialIntelligenceEventPayload {
  brandId?: string;
  entityType?: string;
  entityId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}

export interface SocialInsightResult {
  id: string;
  brandId: string;
  summary: string;
  details: string;
  suggestedActions: string[];
  generatedAt: Date;
}
