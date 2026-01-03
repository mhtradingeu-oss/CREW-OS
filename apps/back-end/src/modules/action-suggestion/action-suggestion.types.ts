// Types for ActionSuggestion module
export interface PlanIntelligenceInsightJson {
  categories?: string[];
  rationale?: string;
  crew?: string;
  confidenceScore?: number;
  riskLevel?: string;
  scope?: string;
  [key: string]: unknown;
}

export interface PlanIntelligenceInsight {
  id: string;
  planKey?: string;
  featureCode: string;
  tenantId?: string | null;
  brandId?: string | null;
  partnerId?: string | null;
  insightType: string;
  insightJson?: PlanIntelligenceInsightJson | null;
  detectedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AICrewRecommendation {
  id: string;
  crew: string;
  recommendationType: string;
  rationale?: string | null;
  confidence?: number | null;
  riskLevel?: string | null;
  insightId?: string | null;
  tenantId?: string | null;
  brandId?: string | null;
  partnerId?: string | null;
  featureCode?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActionSuggestion {
  id: string;
  insightId?: string | null;
  recommendationId?: string | null;
  tenantId?: string | null;
  brandId?: string | null;
  partnerId?: string | null;
  featureCode?: string | null;
  insightType?: string | null;
  crew?: string | null;
  suggestedAction: string;
  rationale?: string | null;
  confidence?: number | null;
  riskLevel?: string | null;
  acknowledgedAt?: string | Date | null;
  dismissedAt?: string | Date | null;
  decisionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}
