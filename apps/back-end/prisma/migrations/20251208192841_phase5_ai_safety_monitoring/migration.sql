/*
  Warnings:

  - A unique constraint covering the columns `[productId,competitor,marketplace,country]` on the table `CompetitorPrice` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AIExecutionStatus" AS ENUM ('SUCCESS', 'ERROR', 'BLOCKED', 'FALLBACK', 'RETRY');

-- CreateEnum
CREATE TYPE "AIRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AIMonitoringCategory" AS ENUM ('ENGINE_HEALTH', 'AGENT_ACTIVITY', 'TOKEN_USAGE', 'PERFORMANCE_METRIC', 'SYSTEM_ALERT');

-- CreateEnum
CREATE TYPE "AIPromptAction" AS ENUM ('ALLOW', 'BLOCK', 'SANITIZE');

-- CreateEnum
CREATE TYPE "AISafetyEventType" AS ENUM ('PROMPT_FIREWALL', 'SAFETY_CONSTRAINT', 'BANNED_ACTION', 'OVERSIGHT', 'RED_TEAM');

-- AlterTable
ALTER TABLE "KnowledgeDocument" ADD COLUMN     "campaignId" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "NotificationTemplate" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "brandId" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'enabled';

-- AlterTable
ALTER TABLE "SocialMention" ADD COLUMN     "keyword" TEXT;

-- CreateTable
CREATE TABLE "DealerKpi" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(65,30),
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "activeStands" INTEGER NOT NULL DEFAULT 0,
    "engagementScore" DOUBLE PRECISION,
    "lastOrderAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DealerKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandKpi" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "standId" TEXT NOT NULL,
    "totalSales" DECIMAL(65,30),
    "totalUnits" INTEGER NOT NULL DEFAULT 0,
    "stockOutEvents" INTEGER NOT NULL DEFAULT 0,
    "lastSaleAt" TIMESTAMP(3),
    "lastStockOutAt" TIMESTAMP(3),
    "regressionScore" DOUBLE PRECISION,
    "engagementScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandKpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EInvoice" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "xmlData" TEXT NOT NULL,
    "validationErrors" JSONB,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "peppolSent" BOOLEAN NOT NULL DEFAULT false,
    "peppolMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceExpense" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinanceInvoice" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "customerId" TEXT,
    "externalId" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "issuedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinanceInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIExecutionLog" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "agentName" TEXT,
    "namespace" TEXT,
    "model" TEXT,
    "provider" TEXT,
    "status" "AIExecutionStatus" NOT NULL,
    "riskLevel" "AIRiskLevel",
    "latencyMs" INTEGER,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "promptPreview" TEXT,
    "outputPreview" TEXT,
    "errorMessage" TEXT,
    "brandId" TEXT,
    "tenantId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIMonitoringEvent" (
    "id" TEXT NOT NULL,
    "category" "AIMonitoringCategory" NOT NULL,
    "status" TEXT,
    "metric" JSONB,
    "agentName" TEXT,
    "engine" TEXT,
    "namespace" TEXT,
    "riskLevel" "AIRiskLevel",
    "brandId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIMonitoringEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISafetyEvent" (
    "id" TEXT NOT NULL,
    "type" "AISafetyEventType" NOT NULL,
    "action" TEXT,
    "ruleId" TEXT,
    "runId" TEXT,
    "agentName" TEXT,
    "namespace" TEXT,
    "riskLevel" "AIRiskLevel",
    "decision" TEXT,
    "detail" JSONB,
    "brandId" TEXT,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISafetyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIPromptFirewallRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "matcherType" TEXT NOT NULL,
    "matcherValue" TEXT NOT NULL,
    "action" "AIPromptAction" NOT NULL,
    "reason" TEXT,
    "severity" "AIRiskLevel",
    "active" BOOLEAN NOT NULL DEFAULT true,
    "tags" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIPromptFirewallRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISafetyConstraint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "scope" TEXT,
    "description" TEXT,
    "ruleJson" TEXT,
    "allowedActionsJson" TEXT,
    "restrictedDomainsJson" TEXT,
    "riskScore" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISafetyConstraint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIBannedAction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "severity" "AIRiskLevel",
    "scope" TEXT,
    "mitigation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIBannedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgentBudget" (
    "id" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "brandId" TEXT,
    "tenantId" TEXT,
    "dailyBudgetUsd" DOUBLE PRECISION,
    "monthlyBudgetUsd" DOUBLE PRECISION,
    "tokenLimit" INTEGER,
    "alertThreshold" DOUBLE PRECISION DEFAULT 0.8,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgentBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DealerKpi_partnerId_brandId_key" ON "DealerKpi"("partnerId", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "StandKpi_standId_brandId_key" ON "StandKpi"("standId", "brandId");

-- CreateIndex
CREATE INDEX "EInvoice_invoiceId_idx" ON "EInvoice"("invoiceId");

-- CreateIndex
CREATE INDEX "FinanceExpense_brandId_idx" ON "FinanceExpense"("brandId");

-- CreateIndex
CREATE INDEX "FinanceInvoice_brandId_idx" ON "FinanceInvoice"("brandId");

-- CreateIndex
CREATE INDEX "AIExecutionLog_brandId_idx" ON "AIExecutionLog"("brandId");

-- CreateIndex
CREATE INDEX "AIExecutionLog_tenantId_idx" ON "AIExecutionLog"("tenantId");

-- CreateIndex
CREATE INDEX "AIExecutionLog_namespace_idx" ON "AIExecutionLog"("namespace");

-- CreateIndex
CREATE INDEX "AIExecutionLog_agentName_idx" ON "AIExecutionLog"("agentName");

-- CreateIndex
CREATE INDEX "AIExecutionLog_status_idx" ON "AIExecutionLog"("status");

-- CreateIndex
CREATE INDEX "AIExecutionLog_createdAt_idx" ON "AIExecutionLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_category_idx" ON "AIMonitoringEvent"("category");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_brandId_idx" ON "AIMonitoringEvent"("brandId");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_tenantId_idx" ON "AIMonitoringEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AIMonitoringEvent_createdAt_idx" ON "AIMonitoringEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AISafetyEvent_type_idx" ON "AISafetyEvent"("type");

-- CreateIndex
CREATE INDEX "AISafetyEvent_brandId_idx" ON "AISafetyEvent"("brandId");

-- CreateIndex
CREATE INDEX "AISafetyEvent_tenantId_idx" ON "AISafetyEvent"("tenantId");

-- CreateIndex
CREATE INDEX "AISafetyEvent_createdAt_idx" ON "AISafetyEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AISafetyConstraint_code_key" ON "AISafetyConstraint"("code");

-- CreateIndex
CREATE UNIQUE INDEX "AIBannedAction_code_key" ON "AIBannedAction"("code");

-- CreateIndex
CREATE INDEX "AIAgentBudget_brandId_idx" ON "AIAgentBudget"("brandId");

-- CreateIndex
CREATE INDEX "AIAgentBudget_tenantId_idx" ON "AIAgentBudget"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "AIAgentBudget_agentName_brandId_tenantId_key" ON "AIAgentBudget"("agentName", "brandId", "tenantId");

-- CreateIndex
CREATE INDEX "AILearningJournal_brandId_idx" ON "AILearningJournal"("brandId");

-- CreateIndex
CREATE INDEX "AILearningJournal_productId_idx" ON "AILearningJournal"("productId");

-- CreateIndex
CREATE INDEX "AIPricingHistory_productId_idx" ON "AIPricingHistory"("productId");

-- CreateIndex
CREATE INDEX "AIPricingHistory_brandId_idx" ON "AIPricingHistory"("brandId");

-- CreateIndex
CREATE INDEX "ActivityLog_brandId_idx" ON "ActivityLog"("brandId");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "BrandProduct_brandId_idx" ON "BrandProduct"("brandId");

-- CreateIndex
CREATE INDEX "BrandProduct_categoryId_idx" ON "BrandProduct"("categoryId");

-- CreateIndex
CREATE INDEX "CompetitorPrice_productId_idx" ON "CompetitorPrice"("productId");

-- CreateIndex
CREATE INDEX "CompetitorPrice_brandId_idx" ON "CompetitorPrice"("brandId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorPrice_productId_competitor_marketplace_country_key" ON "CompetitorPrice"("productId", "competitor", "marketplace", "country");

-- CreateIndex
CREATE INDEX "InventoryItem_brandId_idx" ON "InventoryItem"("brandId");

-- CreateIndex
CREATE INDEX "InventoryItem_warehouseId_idx" ON "InventoryItem"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryItem_productId_idx" ON "InventoryItem"("productId");

-- CreateIndex
CREATE INDEX "InventoryItem_createdAt_idx" ON "InventoryItem"("createdAt");

-- CreateIndex
CREATE INDEX "InventoryTransaction_brandId_idx" ON "InventoryTransaction"("brandId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_warehouseId_idx" ON "InventoryTransaction"("warehouseId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_productId_idx" ON "InventoryTransaction"("productId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_createdAt_idx" ON "InventoryTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_brandId_idx" ON "Notification"("brandId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "ProductPriceDraft_productId_idx" ON "ProductPriceDraft"("productId");

-- CreateIndex
CREATE INDEX "ProductPriceDraft_brandId_idx" ON "ProductPriceDraft"("brandId");

-- CreateIndex
CREATE INDEX "ProductPricing_brandId_idx" ON "ProductPricing"("brandId");

-- CreateIndex
CREATE INDEX "StockAdjustment_brandId_idx" ON "StockAdjustment"("brandId");

-- CreateIndex
CREATE INDEX "StockAdjustment_productId_idx" ON "StockAdjustment"("productId");

-- CreateIndex
CREATE INDEX "StockAdjustment_warehouseId_idx" ON "StockAdjustment"("warehouseId");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "User_brandId_idx" ON "User"("brandId");

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerKpi" ADD CONSTRAINT "DealerKpi_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerKpi" ADD CONSTRAINT "DealerKpi_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandKpi" ADD CONSTRAINT "StandKpi_standId_fkey" FOREIGN KEY ("standId") REFERENCES "Stand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandKpi" ADD CONSTRAINT "StandKpi_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EInvoice" ADD CONSTRAINT "EInvoice_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceExpense" ADD CONSTRAINT "FinanceExpense_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinanceInvoice" ADD CONSTRAINT "FinanceInvoice_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_productId_fkey" FOREIGN KEY ("productId") REFERENCES "BrandProduct"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecutionLog" ADD CONSTRAINT "AIExecutionLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIExecutionLog" ADD CONSTRAINT "AIExecutionLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMonitoringEvent" ADD CONSTRAINT "AIMonitoringEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIMonitoringEvent" ADD CONSTRAINT "AIMonitoringEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISafetyEvent" ADD CONSTRAINT "AISafetyEvent_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISafetyEvent" ADD CONSTRAINT "AISafetyEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentBudget" ADD CONSTRAINT "AIAgentBudget_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentBudget" ADD CONSTRAINT "AIAgentBudget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
