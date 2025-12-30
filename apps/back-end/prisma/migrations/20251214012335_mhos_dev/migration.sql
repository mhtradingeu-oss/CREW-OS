/*
    Warnings:
    - The `resultJson` column on the `AutomationActionRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
    - The `errorJson` column on the `AutomationActionRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
    - The `summaryJson` column on the `AutomationRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
    - The `errorJson` column on the `AutomationRun` table would be dropped and recreated. This will lead to data loss if there is data in the column.
    - Changed the type of `actionConfigJson` on the `AutomationActionRun` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
*/
-- AlterTable
-- AlterTable

ALTER TABLE "AutomationActionRun" DROP COLUMN IF EXISTS "actionConfigJson";
ALTER TABLE "AutomationActionRun" ADD COLUMN IF NOT EXISTS "actionConfigJson" JSONB NOT NULL;
ALTER TABLE "AutomationActionRun" DROP COLUMN IF EXISTS "resultJson";
ALTER TABLE "AutomationActionRun" ADD COLUMN IF NOT EXISTS "resultJson" JSONB;
ALTER TABLE "AutomationActionRun" DROP COLUMN IF EXISTS "errorJson";
ALTER TABLE "AutomationActionRun" ADD COLUMN IF NOT EXISTS "errorJson" JSONB;
ALTER TABLE "AutomationActionRun" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "AutomationRun" DROP COLUMN IF EXISTS "summaryJson";
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "summaryJson" JSONB;
ALTER TABLE "AutomationRun" DROP COLUMN IF EXISTS "errorJson";
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS "errorJson" JSONB;
ALTER TABLE "AutomationRun" ALTER COLUMN "updatedAt" DROP DEFAULT;


CREATE TABLE IF NOT EXISTS "CrmCustomer" (
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

CREATE TABLE IF NOT EXISTS "CampaignLeadAttribution" (
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

CREATE TABLE IF NOT EXISTS "CampaignInteraction" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "CrmCustomer_leadId_key" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CrmCustomer_leadId_idx" ON "CrmCustomer"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CrmCustomer_brandId_idx" ON "CrmCustomer"("brandId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignLeadAttribution_campaignId_idx" ON "CampaignLeadAttribution"("campaignId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignLeadAttribution_leadId_idx" ON "CampaignLeadAttribution"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignLeadAttribution_customerId_idx" ON "CampaignLeadAttribution"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignLeadAttribution_brandId_idx" ON "CampaignLeadAttribution"("brandId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignInteraction_campaignId_idx" ON "CampaignInteraction"("campaignId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignInteraction_leadId_idx" ON "CampaignInteraction"("leadId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CampaignInteraction_customerId_idx" ON "CampaignInteraction"("customerId");

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CrmCustomer_leadId_fkey'
    ) THEN
        ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CrmCustomer_personId_fkey'
    ) THEN
        ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CrmCustomer_companyId_fkey'
    ) THEN
        ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CrmCustomer_firstOrderId_fkey'
    ) THEN
        ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstOrderId_fkey" FOREIGN KEY ("firstOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CrmCustomer_firstRevenueRecordId_fkey'
    ) THEN
        ALTER TABLE "CrmCustomer" ADD CONSTRAINT "CrmCustomer_firstRevenueRecordId_fkey" FOREIGN KEY ("firstRevenueRecordId") REFERENCES "RevenueRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignLeadAttribution_campaignId_fkey'
    ) THEN
        ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignLeadAttribution_leadId_fkey'
    ) THEN
        ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignLeadAttribution_customerId_fkey'
    ) THEN
        ALTER TABLE "CampaignLeadAttribution" ADD CONSTRAINT "CampaignLeadAttribution_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignInteraction_campaignId_fkey'
    ) THEN
        ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignInteraction_leadId_fkey'
    ) THEN
        ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- AddForeignKey
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'CampaignInteraction_customerId_fkey'
    ) THEN
        ALTER TABLE "CampaignInteraction" ADD CONSTRAINT "CampaignInteraction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CrmCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
