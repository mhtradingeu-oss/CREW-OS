-- CreateEnum
CREATE TYPE "TenantPersona" AS ENUM ('RETAILER_DEALER', 'PRODUCT_BRAND_OWNER', 'CREATOR_INFLUENCER', 'MEDIA_PLATFORM', 'SERVICE_PROVIDER', 'MEMBERSHIP_PROGRAM', 'AFFILIATE_MARKETER', 'MARKETING_AGENCY', 'SALES_REP_ORG', 'WHITE_LABEL_BUILDER');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('in_progress', 'completed');

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "planOverridesJson" JSONB;

-- CreateTable
CREATE TABLE "TenantOnboardingProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "persona" "TenantPersona" NOT NULL,
    "selectedPlanKey" TEXT NOT NULL,
    "selectedModulesJson" JSONB,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'in_progress',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantOnboardingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPlanChange" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "fromPlanId" TEXT,
    "toPlanId" TEXT NOT NULL,
    "changedByUserId" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantPlanChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenantOnboardingProfile_tenantId_idx" ON "TenantOnboardingProfile"("tenantId");

-- CreateIndex
CREATE INDEX "TenantOnboardingProfile_userId_idx" ON "TenantOnboardingProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantOnboardingProfile_tenantId_userId_status_key" ON "TenantOnboardingProfile"("tenantId", "userId", "status");

-- CreateIndex
CREATE INDEX "TenantPlanChange_tenantId_idx" ON "TenantPlanChange"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPlanChange_changedByUserId_idx" ON "TenantPlanChange"("changedByUserId");

-- AddForeignKey
ALTER TABLE "TenantOnboardingProfile" ADD CONSTRAINT "TenantOnboardingProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantOnboardingProfile" ADD CONSTRAINT "TenantOnboardingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_fromPlanId_fkey" FOREIGN KEY ("fromPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_toPlanId_fkey" FOREIGN KEY ("toPlanId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlanChange" ADD CONSTRAINT "TenantPlanChange_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
