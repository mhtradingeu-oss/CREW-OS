-- AlterTable
ALTER TABLE "ActionSuggestion" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "decisionReason" TEXT,
ADD COLUMN     "dismissedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FeatureUsageDaily" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "featureCode" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "partnerId" TEXT,
    "routePath" TEXT NOT NULL,
    "usageDate" DATE NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeatureUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanIntelligenceInsight" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "planKey" TEXT NOT NULL,
    "featureCode" TEXT NOT NULL,
    "tenantId" TEXT,
    "brandId" TEXT,
    "partnerId" TEXT,
    "insightType" TEXT NOT NULL,
    "insightJson" JSONB NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanIntelligenceInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AICrewRecommendation" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "crew" TEXT NOT NULL,
    "recommendationType" TEXT NOT NULL,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "insightId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AICrewRecommendation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FeatureUsageDaily_unique" ON "FeatureUsageDaily"("featureCode", "planKey", "tenantId", "brandId", "partnerId", "routePath", "usageDate");
