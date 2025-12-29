-- AlterTable
ALTER TABLE "InfluencerProfile" ADD COLUMN     "audienceJson" TEXT,
ADD COLUMN     "authenticityScore" DOUBLE PRECISION,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "engagementScore" DOUBLE PRECISION,
ADD COLUMN     "fakeFollowerRisk" DOUBLE PRECISION,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "marketFitScore" DOUBLE PRECISION,
ADD COLUMN     "riskNotes" TEXT,
ADD COLUMN     "status" TEXT DEFAULT 'active';

-- CreateTable
CREATE TABLE "InfluencerStatSnapshot" (
    "id" TEXT NOT NULL,
    "influencerId" TEXT NOT NULL,
    "brandId" TEXT,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "fakeFollowerPct" DOUBLE PRECISION,
    "audienceMatchScore" DOUBLE PRECISION,
    "marketFitScore" DOUBLE PRECISION,
    "authenticityScore" DOUBLE PRECISION,
    "avgViews" INTEGER,
    "metricsJson" TEXT,
    "collectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerStatSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerDiscoveryTask" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "query" TEXT,
    "categories" TEXT,
    "platforms" TEXT,
    "status" TEXT DEFAULT 'queued',
    "resultCount" INTEGER,
    "requestedByUserId" TEXT,
    "findingsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerDiscoveryTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerNegotiation" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT,
    "status" TEXT DEFAULT 'draft',
    "lastSuggestedAt" TIMESTAMP(3),
    "termsJson" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerNegotiation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfluencerCampaignLink" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "influencerId" TEXT NOT NULL,
    "campaignId" TEXT,
    "role" TEXT,
    "trackingUrl" TEXT,
    "performanceJson" TEXT,
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerCampaignLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfluencerStatSnapshot_influencerId_idx" ON "InfluencerStatSnapshot"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerStatSnapshot_brandId_idx" ON "InfluencerStatSnapshot"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerDiscoveryTask_brandId_idx" ON "InfluencerDiscoveryTask"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerDiscoveryTask_requestedByUserId_idx" ON "InfluencerDiscoveryTask"("requestedByUserId");

-- CreateIndex
CREATE INDEX "InfluencerNegotiation_brandId_idx" ON "InfluencerNegotiation"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerNegotiation_influencerId_idx" ON "InfluencerNegotiation"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_brandId_idx" ON "InfluencerCampaignLink"("brandId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_influencerId_idx" ON "InfluencerCampaignLink"("influencerId");

-- CreateIndex
CREATE INDEX "InfluencerCampaignLink_campaignId_idx" ON "InfluencerCampaignLink"("campaignId");

-- AddForeignKey
ALTER TABLE "InfluencerStatSnapshot" ADD CONSTRAINT "InfluencerStatSnapshot_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerStatSnapshot" ADD CONSTRAINT "InfluencerStatSnapshot_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerDiscoveryTask" ADD CONSTRAINT "InfluencerDiscoveryTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerDiscoveryTask" ADD CONSTRAINT "InfluencerDiscoveryTask_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerNegotiation" ADD CONSTRAINT "InfluencerNegotiation_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerNegotiation" ADD CONSTRAINT "InfluencerNegotiation_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfluencerCampaignLink" ADD CONSTRAINT "InfluencerCampaignLink_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
