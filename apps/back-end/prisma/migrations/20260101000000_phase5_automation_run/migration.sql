DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE t.typname = 'AutomationRunStatus'
            AND n.nspname = 'public'
    ) THEN
        CREATE TYPE "AutomationRunStatus" AS ENUM (
            'PENDING',
            'RUNNING',
            'SUCCESS',
            'FAILED',
            'SKIPPED'
        );
    END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AutomationRun" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "brandId" TEXT,
    "eventName" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
    "payloadJson" JSONB,
    "metaJson" JSONB,
    "traceJson" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutomationRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomationRun_brandId_idx" ON "AutomationRun" ("brandId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AutomationRun_ruleId_idx" ON "AutomationRun" ("ruleId");

-- AlterTable
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'AutomationRun_ruleId_fkey'
    ) THEN
        ALTER TABLE "AutomationRun" ADD CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule"("id") ON DELETE CASCADE;
    END IF;
END
$$;
