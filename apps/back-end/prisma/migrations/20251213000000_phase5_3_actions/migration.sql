-- Create automation run enums
CREATE TYPE "AutomationRunStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'PARTIAL'
);

CREATE TYPE "AutomationActionRunStatus" AS ENUM (
  'PENDING',
  'RUNNING',
  'SUCCESS',
  'FAILED',
  'SKIPPED',
  'RETRYING'
);

-- Create automation run table
CREATE TABLE "AutomationRun" (
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

CREATE INDEX "AutomationRun_ruleId_idx" ON "AutomationRun" ("ruleId");
CREATE INDEX "AutomationRun_eventId_idx" ON "AutomationRun" ("eventId");

-- Create automation action run table
CREATE TABLE "AutomationActionRun" (
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

CREATE INDEX "AutomationActionRun_runId_idx" ON "AutomationActionRun" ("runId");
