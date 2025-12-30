
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
      'PARTIAL'
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'AutomationActionRunStatus'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE "AutomationActionRunStatus" AS ENUM (
      'PENDING',
      'RUNNING',
      'SUCCESS',
      'FAILED',
      'SKIPPED',
      'RETRYING'
    );
  END IF;
END
$$;

-- Create automation run table
CREATE TABLE IF NOT EXISTS "AutomationRun" (
  "id" TEXT PRIMARY KEY,
  "ruleId" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "eventId" TEXT,
  "status" "AutomationRunStatus" NOT NULL DEFAULT 'PENDING',
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "summaryJson" TEXT,
  "errorJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AutomationRun_ruleId_idx" ON "AutomationRun" ("ruleId");
CREATE INDEX IF NOT EXISTS "AutomationRun_eventId_idx" ON "AutomationRun" ("eventId");

-- Create automation action run table
CREATE TABLE IF NOT EXISTS "AutomationActionRun" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "actionIndex" INTEGER NOT NULL,
  "actionType" TEXT NOT NULL,
  "status" "AutomationActionRunStatus" NOT NULL DEFAULT 'PENDING',
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "dedupKey" TEXT NOT NULL UNIQUE,
  "actionConfigJson" TEXT NOT NULL,
  "resultJson" TEXT,
  "errorJson" TEXT,
  "startedAt" TIMESTAMP(3),
  "finishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationActionRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AutomationRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AutomationActionRun_runId_idx" ON "AutomationActionRun" ("runId");
