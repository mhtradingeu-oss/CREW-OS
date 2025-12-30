DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AutomationRuleLifecycleState'
            AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "AutomationRuleLifecycleState" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'ARCHIVED');
    END IF;
END
$$;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AutomationRuleLifecycleState'
            AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "AutomationRuleLifecycleState" AS ENUM ('DRAFT', 'REVIEW', 'ACTIVE', 'PAUSED', 'ARCHIVED');
    END IF;
END
$$;

-- AlterEnum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'AutomationRunStatus'
            AND e.enumlabel = 'SKIPPED'
    ) THEN
        ALTER TYPE "AutomationRunStatus" ADD VALUE 'SKIPPED';
    END IF;
END
$$;

-- AlterTable
ALTER TABLE "AutomationActionRun" ADD COLUMN IF NOT EXISTS     "summary" TEXT;

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
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "actionsJson" JSONB;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "conditionsJson" JSONB;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "dedupKey" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "ruleMetaJson" JSONB;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "ruleVersionId" TEXT;
ALTER TABLE "AutomationRun" ADD COLUMN IF NOT EXISTS     "triggerEventJson" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AutomationRuleVersion" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "AutomationRuleVersion_ruleId_versionNumber_key" ON "AutomationRuleVersion"("ruleId", "versionNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomationRun_ruleVersionId_idx" ON "AutomationRun"("ruleVersionId");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'AutomationRuleVersion_ruleId_fkey'
    ) THEN
        ALTER TABLE "AutomationRuleVersion" ADD CONSTRAINT "AutomationRuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'AutomationRun_ruleVersionId_fkey'
    ) THEN
        ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleVersionId_fkey" FOREIGN KEY ("ruleVersionId") REFERENCES "AutomationRuleVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
