// Phase-B compatibility re-exports (NO logic)
export type {
  CampaignIdeasInput,
  CampaignIdeasOutput,
  LeadFollowupInput,
  LeadFollowupOutput,
  PricingSuggestionInput,
  PricingSuggestionOutput,
  AiBrainEventPayload,
  CreateAiBrainInput,
  UpdateAiBrainInput,
} from "@mh-os/shared";

// All domain types have been moved to @mh-os/shared. Only UI/View/Props types may remain here.

import type {
  AiBaseInput,
  SalesKpiSummary,
  CampaignIdeasInput,
  CampaignIdeasOutput,
  LeadFollowupInput,
  LeadFollowupOutput,
  PricingSuggestionInput,
  PricingSuggestionOutput,
  AiBrainEventPayload,
  CreateAiBrainInput,
  UpdateAiBrainInput
} from "@mh-os/shared";

export interface StandInventoryContext {
  locationId?: string;
  locationName?: string;
  productId: string;
  sku?: string;
  name?: string;
  quantity: number;
  status?: string;
  lastRefillAt?: string;
}

export interface StandPerformanceBrief {
  standId: string;
  standName: string;
  totalOrders: number;
  totalRevenue: number;
  stockOutLocations: number;
  refillOrdersPending: number;
  lastRefillAt?: string;
  latestSnapshot?: {
    period?: string;
    metrics?: Record<string, unknown>;
  };
}

export interface StandStockSuggestionInput extends AiBaseInput {
  standId: string;
  inventorySnapshot: StandInventoryContext[];
  performance: StandPerformanceBrief;
  scope?: string;
  notes?: string;
}

export interface StandStockSuggestionOutput {
  lowStock: Array<{
    productId: string;
    sku?: string;
    name?: string;
    currentQty: number;
    suggestedQty: number;
    reason: string;
  }>;
  slowMovers: Array<{
    productId: string;
    sku?: string;
    name?: string;
    suggestion: string;
    campaignIdea?: string;
  }>;
  summary: string;
}

export interface SalesLeadAiContext {
  leadId: string;
  name?: string;
  stage?: string;
  status?: string;
  score?: number;
  lastInteraction?: string;
  nextAction?: string;
  source?: string;
}

export interface SalesVisitAiContext {
  visitId: string;
  partnerId?: string;
  purpose?: string;
  result?: string;
  date?: string;
}

export interface SalesRepPlanInput extends AiBaseInput {
  repId: string;
  scope?: string;
  notes?: string;
  leads: SalesLeadAiContext[];
  visits: SalesVisitAiContext[];
  kpis: SalesKpiSummary;
}

export interface SalesRepPlanOutput {
  prioritizedLeads: Array<{
    leadId: string;
    name?: string;
    stage?: string;
    score?: number;
    reason: string;
  }>;
  suggestedActions: Array<{
    leadId?: string;
    type: string;
    description: string;
  }>;
  emailTemplates?: Array<{
    leadId?: string;
    subject: string;
    body: string;
  }>;
  summary: string;
}

export interface BrandHealthInput extends AiBaseInput {
  highlights?: string[];
}

export interface BrandHealthOutput {
  overview: string;
  risks?: string[];
  nextSteps?: string[];
}

export interface KpiNarrativeInput extends AiBaseInput {
  metrics?: Record<string, unknown>;
}

export interface KpiNarrativeOutput {
  overview: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  severity?: "low" | "medium" | "high";
}

export interface KPIRevenueSeries {
  label: string;
  value: number;
  currency?: string | null;
}

export interface KPIPricingDeltaSeries {
  label: string;
  change: number;
}

export interface KPIInventoryRiskSeries {
  label: string;
  lowStock: number;
  stockouts: number;
}

export interface KPIMarketingSeries {
  label: string;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface KPILoyaltySeries {
  label: string;
  transactions: number;
  points: number;
}

export interface KPIDemandSeries {
  label: string;
  leads: number;
  deals: number;
}

export interface KPIAggSummary {
  revenueTotal: number;
  revenueCurrency?: string | null;
  revenueChange?: number | null;
  pricingDeltaAvg?: number | null;
  lowStock?: number;
  stockouts?: number;
  conversionRate?: number | null;
  loyaltyTransactions?: number;
  loyaltyPointsNet?: number;
  marketingConversions?: number;
}

export interface KPINarrative {
  overview: string;
  highlights: string[];
  risks: string[];
  nextSteps: string[];
  severity?: "low" | "medium" | "high";
}

export interface KPIOverviewPayload {
  brandId?: string;
  scope?: string;
  periodStart?: Date | string;
  periodEnd?: Date | string;
  revenueSeries: KPIRevenueSeries[];
  pricingSeries: KPIPricingDeltaSeries[];
  inventorySeries: KPIInventoryRiskSeries[];
  marketingSeries: KPIMarketingSeries[];
  loyaltySeries: KPILoyaltySeries[];
  demandSeries: KPIDemandSeries[];
  summary: KPIAggSummary;
  aiNarrative?: KPINarrative;
}

export interface FinanceRunwaySummary {
  summary: string;
  details: string;
  runwayMonths?: number | null;
  cashBalance?: number | null;
  burnRate?: number | null;
}

export type DepartmentScope =
  | "marketing"
  | "sales"
  | "crm"
  | "loyalty"
  | "finance"
  | "inventory"
  | "brand";

export interface DepartmentAgentProfile {
  key: DepartmentScope;
  name: string;
  charter: string;
  defaultFocus: string;
}

export interface VirtualOffice {
  brandId?: string;
  topic: string;
  scope?: string;
  departments: DepartmentScope[];
}

export interface MeetingAgendaItem {
  title: string;
  desiredOutcome: string;
  owner?: string;
  dueDate?: string;
}

export interface MeetingActionItem {
  department: DepartmentScope;
  task: string;
  owner?: string;
  dueDate?: string;
  impact?: string;
}

export interface DepartmentRecommendation {
  department: DepartmentScope;
  headline: string;
  summary: string;
  actionItems: MeetingActionItem[];
}

export interface VirtualOfficeMeetingSummary {
  summary: string;
  details?: string;
  brand?: { id: string; name: string; slug?: string };
  scope?: string;
  topic: string;
  departments: DepartmentScope[];
  recommendations: DepartmentRecommendation[];
  agenda: MeetingAgendaItem[];
  actionItems: MeetingActionItem[];
  risks?: string[];
}

export interface VirtualOfficeMeetingRequest extends AiBaseInput {
  topic: string;
  scope?: string;
  brandId?: string;
  departments: DepartmentScope[];
  agenda?: string[];
  notes?: string;
  standContext?: StandContextPayload;
  salesRepContext?: SalesRepContextPayload;
}

export interface StandContextPayload {
  standId?: string;
  products?: Array<{
    productId: string;
    sku?: string;
    name?: string;
    currentQty?: number;
    location?: string;
  }>;
  inventorySnapshot?: StandInventoryContext[];
  notes?: string;
}

export interface SalesRepContextPayload {
  repId?: string;
  leads?: Array<{
    leadId?: string;
    name?: string;
    stage?: string;
    score?: number;
    status?: string;
  }>;
  visits?: SalesVisitAiContext[];
  notes?: string;
}

export interface AIInsightDTO {
  id: string;
  brandId?: string;
  os?: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InsightListParams {
  brandId: string;
  os?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface InsightListResponse {
  items: AIInsightDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateInsightInput {
  brandId: string;
  os?: string;
  entityType?: string;
  entityId?: string;
  summary?: string;
  details?: string;
}

export interface AIReportDTO {
  id: string;
  brandId?: string;
  title: string;
  scope?: string;
  periodStart?: Date;
  periodEnd?: Date;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportListParams {
  brandId: string;
  scope?: string;
  periodStart?: Date;
  periodEnd?: Date;
  page?: number;
  pageSize?: number;
}

export interface ReportListResponse {
  items: AIReportDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateReportInput {
  brandId: string;
  title: string;
  scope?: string;
  periodStart?: Date;
  periodEnd?: Date;
  content?: string;
  meta?: Record<string, unknown>;
}

export interface AILearningLogDTO {
  id: string;
  brandId?: string;
  productId?: string;
  source?: string;
  eventType?: string;
  inputSnapshot?: unknown;
  outputSnapshot?: unknown;
  createdAt: Date;
}

export interface LearningListParams {
  brandId: string;
  productId?: string;
  eventType?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}

export interface LearningListResponse {
  items: AILearningLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateLearningLogInput {
  brandId: string;
  productId?: string;
  source: string;
  eventType: string;
  inputSnapshot?: unknown;
  outputSnapshot?: unknown;
}
