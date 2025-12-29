/*
  Warnings:

  - The `resultJson` column on the `AutomationActionRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `errorJson` column on the `AutomationActionRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summaryJson` column on the `AutomationRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `errorJson` column on the `AutomationRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `actionConfigJson` on the `AutomationActionRun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AutomationActionRun" DROP COLUMN "actionConfigJson",
ADD COLUMN     "actionConfigJson" JSONB NOT NULL,
DROP COLUMN "resultJson",
ADD COLUMN     "resultJson" JSONB,
DROP COLUMN "errorJson",
ADD COLUMN     "errorJson" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AutomationRun" DROP COLUMN "summaryJson",
ADD COLUMN     "summaryJson" JSONB,
DROP COLUMN "errorJson",
ADD COLUMN     "errorJson" JSONB,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "CrmCustomer" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "leadId" TEXT NOT NULL,
    "personId" TEXT,
    "companyId" TEXT,
    "firstOrderId" TEXT,
    "firstRevenueRecordId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignLeadAttribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "brandId" TEXT,
    "leadId" TEXT,
    "customerId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignLeadAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignInteraction" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "leadId" TEXT,
    "customerId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmCustomer_leadId_key" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX "CrmCustomer_leadId_idx" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX "CrmCustomer_brandId_idx" ON "CrmCustomer"("brandId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_campaignId_idx" ON "CampaignLeadAttribution"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_leadId_idx" ON "CampaignLeadAttribution"("leadId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_customerId_idx" ON "CampaignLeadAttribution"("customerId");

-- CreateIndex
CREATE INDEX "CampaignLeadAttribution_brandId_idx" ON "CampaignLeadAttribution"("brandId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_campaignId_idx" ON "CampaignInteraction"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_leadId_idx" ON "CampaignInteraction"("leadId");

-- CreateIndex
CREATE INDEX "CampaignInteraction_customerId_idx" ON "CampaignInteraction"("customerId");

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstOrderId_fkey" FOREIGN KEY ("firstOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstRevenueRecordId_fkey" FOREIGN KEY ("firstRevenueRecordId") REFERENCES "RevenueRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
