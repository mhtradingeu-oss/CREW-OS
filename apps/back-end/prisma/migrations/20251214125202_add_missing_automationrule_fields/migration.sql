-- AlterTable
ALTER TABLE "AutomationRule" ADD COLUMN     "actionsJson" JSONB,
ADD COLUMN     "conditionsJson" JSONB,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "triggerEvent" TEXT,
ADD COLUMN     "triggerType" TEXT;
