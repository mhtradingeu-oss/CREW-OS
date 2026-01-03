-- Create FeatureUsageDaily aggregation table (optional, analytics only)
CREATE TABLE IF NOT EXISTS "FeatureUsageDaily" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  featureCode TEXT NOT NULL,
  planKey TEXT NOT NULL,
  tenantId TEXT,
  brandId TEXT,
  partnerId TEXT,
  routePath TEXT NOT NULL,
  usageDate DATE NOT NULL,
  usageCount INTEGER NOT NULL DEFAULT 1,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(featureCode, planKey, tenantId, brandId, partnerId, routePath, usageDate)
);

