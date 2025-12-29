-- AlterTable
ALTER TABLE "BrandProduct" ADD COLUMN     "analyticsProfileJson" TEXT,
ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "complianceProfileJson" TEXT,
ADD COLUMN     "distributionProfileJson" TEXT,
ADD COLUMN     "ean" TEXT,
ADD COLUMN     "lifecycleStage" TEXT DEFAULT 'concept',
ADD COLUMN     "localizationProfileJson" TEXT,
ADD COLUMN     "marketingProfileJson" TEXT,
ADD COLUMN     "qrCodeUrl" TEXT,
ADD COLUMN     "seoProfileJson" TEXT,
ADD COLUMN     "socialProofJson" TEXT,
ADD COLUMN     "tags" JSONB,
ADD COLUMN     "upc" TEXT;

-- AlterTable
ALTER TABLE "CompetitorSocialReport" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "faqJson" TEXT;

-- AlterTable
ALTER TABLE "ProductPriceDraft" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "guardrailMaxDiscount" DECIMAL(65,30),
ADD COLUMN     "guardrailMinMargin" DECIMAL(65,30),
ADD COLUMN     "mapPrice" DECIMAL(65,30),
ADD COLUMN     "marginTarget" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ProductPricing" ADD COLUMN     "currency" TEXT,
ADD COLUMN     "ebayNet" DECIMAL(65,30),
ADD COLUMN     "guardrailMaxDiscount" DECIMAL(65,30),
ADD COLUMN     "guardrailMinMargin" DECIMAL(65,30),
ADD COLUMN     "mapPrice" DECIMAL(65,30),
ADD COLUMN     "marginTarget" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ReorderSuggestion" ADD COLUMN     "lifecycleStage" TEXT;

-- AlterTable
ALTER TABLE "SEOContent" ADD COLUMN     "locale" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "schemaMarkup" TEXT,
ADD COLUMN     "urlSlug" TEXT;

-- AlterTable
ALTER TABLE "SocialMention" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "SocialTrend" ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "WhiteLabelProduct" ADD COLUMN     "distributionJson" TEXT,
ADD COLUMN     "lifecycleStage" TEXT DEFAULT 'concept',
ADD COLUMN     "seoJson" TEXT;

-- CreateTable
CREATE TABLE "ProductLocalization" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "marketingText" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "seoKeywords" TEXT,
    "urlSlug" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLocalization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCompliance" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "country" TEXT,
    "ingredients" TEXT,
    "warnings" TEXT,
    "certifications" TEXT,
    "legalNotes" TEXT,
    "docsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductCompliance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDistributionProfile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "channel" TEXT NOT NULL,
    "marketplace" TEXT,
    "country" TEXT,
    "listingTitle" TEXT,
    "bulletsJson" TEXT,
    "description" TEXT,
    "searchTerms" TEXT,
    "fulfillmentType" TEXT,
    "feesEstimate" DECIMAL(65,30),
    "moq" INTEGER,
    "wholesalePrice" DECIMAL(65,30),
    "metadataJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDistributionProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMarketingProfile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "audience" TEXT,
    "painPoints" TEXT,
    "benefits" TEXT,
    "usp" TEXT,
    "hooksJson" TEXT,
    "scriptsJson" TEXT,
    "influencerBriefJson" TEXT,
    "channelCreativeJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMarketingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductSocialProof" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "rating" DOUBLE PRECISION,
    "reviewsCount" INTEGER,
    "testimonialLinksJson" TEXT,
    "mediaLinksJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductSocialProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductAnalyticsHook" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandId" TEXT,
    "channel" TEXT,
    "period" TEXT,
    "impressions" INTEGER,
    "ctr" DOUBLE PRECISION,
    "conversion" DOUBLE PRECISION,
    "refundRate" DOUBLE PRECISION,
    "repeatPurchase" DOUBLE PRECISION,
    "roas" DOUBLE PRECISION,
    "collectedAt" TIMESTAMP(3),
    "metricsJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductAnalyticsHook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductLocalization_brandId_idx" ON "ProductLocalization"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocalization_productId_locale_key" ON "ProductLocalization"("productId", "locale");

-- CreateIndex
CREATE INDEX "ProductCompliance_productId_idx" ON "ProductCompliance"("productId");

-- CreateIndex
CREATE INDEX "ProductCompliance_brandId_idx" ON "ProductCompliance"("brandId");

-- CreateIndex
CREATE INDEX "ProductDistributionProfile_productId_idx" ON "ProductDistributionProfile"("productId");

-- CreateIndex
CREATE INDEX "ProductDistributionProfile_brandId_idx" ON "ProductDistributionProfile"("brandId");

-- CreateIndex
CREATE INDEX "ProductMarketingProfile_productId_idx" ON "ProductMarketingProfile"("productId");

-- CreateIndex
CREATE INDEX "ProductMarketingProfile_brandId_idx" ON "ProductMarketingProfile"("brandId");

-- CreateIndex
CREATE INDEX "ProductSocialProof_productId_idx" ON "ProductSocialProof"("productId");

-- CreateIndex
CREATE INDEX "ProductSocialProof_brandId_idx" ON "ProductSocialProof"("brandId");

-- CreateIndex
CREATE INDEX "ProductAnalyticsHook_productId_idx" ON "ProductAnalyticsHook"("productId");

-- CreateIndex
CREATE INDEX "ProductAnalyticsHook_brandId_idx" ON "ProductAnalyticsHook"("brandId");

-- CreateIndex
CREATE INDEX "ProductAnalyticsHook_channel_idx" ON "ProductAnalyticsHook"("channel");

-- CreateIndex
CREATE INDEX "CompetitorSocialReport_productId_idx" ON "CompetitorSocialReport"("productId");

-- CreateIndex
CREATE INDEX "SEOContent_productId_idx" ON "SEOContent"("productId");

-- CreateIndex
CREATE INDEX "SocialMention_productId_idx" ON "SocialMention"("productId");

-- CreateIndex
CREATE INDEX "SocialTrend_productId_idx" ON "SocialTrend"("productId");

-- AddForeignKey
ALTER TABLE "ProductLocalization" ADD CONSTRAINT "ProductLocalization_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocalization" ADD CONSTRAINT "ProductLocalization_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompliance" ADD CONSTRAINT "ProductCompliance_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompliance" ADD CONSTRAINT "ProductCompliance_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDistributionProfile" ADD CONSTRAINT "ProductDistributionProfile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductDistributionProfile" ADD CONSTRAINT "ProductDistributionProfile_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMarketingProfile" ADD CONSTRAINT "ProductMarketingProfile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMarketingProfile" ADD CONSTRAINT "ProductMarketingProfile_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSocialProof" ADD CONSTRAINT "ProductSocialProof_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductSocialProof" ADD CONSTRAINT "ProductSocialProof_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsHook" ADD CONSTRAINT "ProductAnalyticsHook_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductAnalyticsHook" ADD CONSTRAINT "ProductAnalyticsHook_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SEOContent" ADD CONSTRAINT "SEOContent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialMention" ADD CONSTRAINT "SocialMention_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialTrend" ADD CONSTRAINT "SocialTrend_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorSocialReport" ADD CONSTRAINT "CompetitorSocialReport_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;
