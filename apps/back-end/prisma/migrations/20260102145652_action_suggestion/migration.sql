/*
  Warnings:

  - The values [ERROR,BLOCKED,FALLBACK,RETRY] on the enum `AIExecutionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ENGINE_HEALTH,AGENT_ACTIVITY,TOKEN_USAGE,PERFORMANCE_METRIC,SYSTEM_ALERT] on the enum `AIMonitoringCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `configJson` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `osScope` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AIAgentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PartnerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PartnerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `PartnerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PartnerOrder` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `orderId` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PartnerOrderItem` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PartnerPricing` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `PartnerPricing` table. All the data in the column will be lost.
  - You are about to drop the column `netPrice` on the `PartnerPricing` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `PartnerPricing` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PartnerPricing` table. All the data in the column will be lost.
  - You are about to drop the column `featuresJson` on the `Plan` table. All the data in the column will be lost.
  - You are about to drop the `AIBannedAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FeatureUsageDaily` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlanIntelligenceInsight` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roleId,permissionId]` on the table `RolePermission` will be added. If there are existing duplicate values, this will fail.
  - Made the column `brandId` on table `AIAgentConfig` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `warehouseId` to the `CompetitorPrice` table without a default value. This is not possible if the table is not empty.
  - Made the column `brandId` on table `PartnerOrder` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `brandProductId` to the `PartnerOrderItem` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandProductId` to the `PartnerPricing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scope` to the `Plan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('ADJUSTMENT', 'SALE', 'RESTOCK', 'TRANSFER', 'RETURN');

-- CreateEnum
CREATE TYPE "ReorderSuggestionStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateEnum
CREATE TYPE "PlanScope" AS ENUM ('TENANT', 'BRAND', 'PARTNER', 'WHITE_LABEL');

-- AlterEnum
BEGIN;
CREATE TYPE "AIExecutionStatus_new" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');
ALTER TABLE "AIExecutionLog" ALTER COLUMN "status" TYPE "AIExecutionStatus_new" USING ("status"::text::"AIExecutionStatus_new");
ALTER TYPE "AIExecutionStatus" RENAME TO "AIExecutionStatus_old";
ALTER TYPE "AIExecutionStatus_new" RENAME TO "AIExecutionStatus";
DROP TYPE "AIExecutionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AIMonitoringCategory_new" AS ENUM ('PLACEHOLDER');
ALTER TABLE "AIMonitoringEvent" ALTER COLUMN "category" TYPE "AIMonitoringCategory_new" USING ("category"::text::"AIMonitoringCategory_new");
ALTER TYPE "AIMonitoringCategory" RENAME TO "AIMonitoringCategory_old";
ALTER TYPE "AIMonitoringCategory_new" RENAME TO "AIMonitoringCategory";
DROP TYPE "AIMonitoringCategory_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AIAgentConfig" DROP CONSTRAINT "AIAgentConfig_brandId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerOrder" DROP CONSTRAINT "PartnerOrder_brandId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerOrderItem" DROP CONSTRAINT "PartnerOrderItem_orderId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerOrderItem" DROP CONSTRAINT "PartnerOrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "PartnerPricing" DROP CONSTRAINT "PartnerPricing_productId_fkey";

-- DropIndex
DROP INDEX "AIAgentBudget_brandId_idx";

-- DropIndex
DROP INDEX "AIAgentBudget_tenantId_idx";

-- DropIndex
DROP INDEX "AIAgentConfig_name_key";

-- DropIndex
DROP INDEX "AIExecutionLog_status_idx";

-- AlterTable
ALTER TABLE "AIAgentConfig" DROP COLUMN "configJson",
DROP COLUMN "createdAt",
DROP COLUMN "enabled",
DROP COLUMN "name",
DROP COLUMN "osScope",
DROP COLUMN "updatedAt",
ALTER COLUMN "brandId" SET NOT NULL;

-- AlterTable
ALTER TABLE "CompetitorPrice" ADD COLUMN     "warehouseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PartnerOrder" DROP COLUMN "createdAt",
DROP COLUMN "status",
DROP COLUMN "total",
DROP COLUMN "updatedAt",
ALTER COLUMN "brandId" SET NOT NULL;

-- AlterTable
ALTER TABLE "PartnerOrderItem" DROP COLUMN "createdAt",
DROP COLUMN "orderId",
DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "quantity",
DROP COLUMN "updatedAt",
ADD COLUMN     "brandProductId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PartnerPricing" DROP COLUMN "createdAt",
DROP COLUMN "currency",
DROP COLUMN "netPrice",
DROP COLUMN "productId",
DROP COLUMN "updatedAt",
ADD COLUMN     "brandProductId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Plan" DROP COLUMN "featuresJson",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scope" "PlanScope" NOT NULL;

DROP TABLE "AIBannedAction";
-- DROP TABLE "FeatureUsageDaily";
-- DROP TABLE "PlanIntelligenceInsight";
DROP TABLE "FeatureUsageDaily";

-- DropTable
DROP TABLE "PlanIntelligenceInsight";

-- CreateTable
CREATE TABLE "ActionSuggestion" (
    "id" TEXT NOT NULL,
    "insightId" TEXT,
    "recommendationId" TEXT,
    "tenantId" TEXT,
    "brandId" TEXT,
    "partnerId" TEXT,
    "featureCode" TEXT,
    "insightType" TEXT,
    "crew" TEXT,
    "suggestedAction" TEXT NOT NULL,
    "rationale" TEXT,
    "confidence" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockAdjustment" (
    "id" TEXT NOT NULL,
    "inventoryTransactionId" TEXT NOT NULL,
    "adjustmentReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReorderSuggestion" (
    "id" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "inventoryItemId" TEXT NOT NULL,
    "status" "ReorderSuggestionStatus" NOT NULL DEFAULT 'OPEN',
    "suggestedQty" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ReorderSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanFeature" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "featureId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PlanFeature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionSuggestion_tenantId_idx" ON "ActionSuggestion"("tenantId");

-- CreateIndex
CREATE INDEX "ActionSuggestion_brandId_idx" ON "ActionSuggestion"("brandId");

-- CreateIndex
CREATE INDEX "ActionSuggestion_partnerId_idx" ON "ActionSuggestion"("partnerId");

-- CreateIndex
CREATE INDEX "ActionSuggestion_featureCode_idx" ON "ActionSuggestion"("featureCode");

-- CreateIndex
CREATE INDEX "ActionSuggestion_insightType_idx" ON "ActionSuggestion"("insightType");

-- CreateIndex
CREATE INDEX "ActionSuggestion_crew_idx" ON "ActionSuggestion"("crew");

-- CreateIndex
CREATE INDEX "ActionSuggestion_createdAt_idx" ON "ActionSuggestion"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StockAdjustment_inventoryTransactionId_key" ON "StockAdjustment"("inventoryTransactionId");

-- CreateIndex
CREATE UNIQUE INDEX "Feature_code_key" ON "Feature"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PlanFeature_planId_featureId_key" ON "PlanFeature"("planId", "featureId");

-- CreateIndex
CREATE INDEX "AIAgentBudget_createdAt_idx" ON "AIAgentBudget"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "CompetitorPrice" ADD CONSTRAINT "CompetitorPrice_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockAdjustment" ADD CONSTRAINT "StockAdjustment_inventoryTransactionId_fkey" FOREIGN KEY ("inventoryTransactionId") REFERENCES "InventoryTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReorderSuggestion" ADD CONSTRAINT "ReorderSuggestion_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrder" ADD CONSTRAINT "PartnerOrder_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgentConfig" ADD CONSTRAINT "AIAgentConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerOrderItem" ADD CONSTRAINT "PartnerOrderItem_brandProductId_fkey" FOREIGN KEY ("brandProductId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerPricing" ADD CONSTRAINT "PartnerPricing_brandProductId_fkey" FOREIGN KEY ("brandProductId") REFERENCES "BrandProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanFeature" ADD CONSTRAINT "PlanFeature_featureId_fkey" FOREIGN KEY ("featureId") REFERENCES "Feature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
