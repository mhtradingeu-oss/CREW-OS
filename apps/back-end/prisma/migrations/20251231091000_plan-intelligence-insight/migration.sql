-- Create PlanIntelligenceInsight table for AI-driven plan analytics (read-only, async, safe)
CREATE TABLE IF NOT EXISTS "PlanIntelligenceInsight" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planKey TEXT NOT NULL,
  featureCode TEXT NOT NULL,
  tenantId TEXT,
  brandId TEXT,
  partnerId TEXT,
  insightType TEXT NOT NULL, -- e.g. 'OVERUSE', 'PLAN_MISMATCH', 'UPGRADE_SIGNAL'
  insightJson JSONB NOT NULL,
  detectedAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now()
);

