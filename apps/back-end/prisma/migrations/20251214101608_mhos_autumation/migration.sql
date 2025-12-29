/*
  Warnings:

  - You are about to drop the column `actionsConfigJson` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `actionsJson` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `conditionConfigJson` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `conditionsJson` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `enabled` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `triggerConfigJson` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `triggerEvent` on the `AutomationRule` table. All the data in the column will be lost.
  - You are about to drop the column `triggerType` on the `AutomationRule` table. All the data in the column will be lost.
  - Added the required column `ruleVersionId` to the `AutomationRun` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AutomationRuleLifecycleState" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- AlterEnum
ALTER TYPE "AutomationRunStatus" ADD VALUE 'SKIPPED';

-- AlterTable
ALTER TABLE "AutomationActionRun" ADD COLUMN     "summary" TEXT;

-- AlterTable
ALTER TABLE "AutomationRule" DROP COLUMN "actionsConfigJson",
DROP COLUMN "actionsJson",
DROP COLUMN "conditionConfigJson",
DROP COLUMN "conditionsJson",
DROP COLUMN "enabled",
DROP COLUMN "triggerConfigJson",
DROP COLUMN "triggerEvent",
DROP COLUMN "triggerType",
ADD COLUMN     "state" "AutomationRuleLifecycleState" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "AutomationRun" ADD COLUMN     "actionsJson" JSONB,
ADD COLUMN     "conditionsJson" JSONB,
ADD COLUMN     "dedupKey" TEXT,
ADD COLUMN     "ruleMetaJson" JSONB,
ADD COLUMN     "ruleVersionId" TEXT NOT NULL,
ADD COLUMN     "triggerEventJson" JSONB;

-- CreateTable
CREATE TABLE "AutomationRuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "triggerEvent" TEXT NOT NULL,
    "conditionConfigJson" JSONB NOT NULL,
    "actionsConfigJson" JSONB NOT NULL,
    "metaSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,
    "state" "AutomationRuleLifecycleState" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "AutomationRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AutomationRuleVersion_ruleId_versionNumber_key" ON "AutomationRuleVersion"("ruleId", "versionNumber");

-- CreateIndex
CREATE INDEX "AutomationRun_ruleVersionId_idx" ON "AutomationRun"("ruleVersionId");

-- AddForeignKey
ALTER TABLE "AutomationRuleVersion" ADD CONSTRAINT "AutomationRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "AutomationRuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
