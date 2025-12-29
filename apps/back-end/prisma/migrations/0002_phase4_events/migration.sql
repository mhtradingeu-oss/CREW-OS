-- Activity log table
CREATE TABLE "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "brandId" TEXT,
    "userId" TEXT,
    "module" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "severity" TEXT,
    "metaJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Automation rule enhancements
ALTER TABLE "AutomationRule"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "triggerType" TEXT NOT NULL DEFAULT 'event',
  ADD COLUMN "triggerConfigJson" TEXT,
  ADD COLUMN "conditionConfigJson" TEXT,
  ADD COLUMN "actionsConfigJson" TEXT,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "updatedById" TEXT,
  ADD COLUMN "lastRunAt" TIMESTAMP(3),
  ADD COLUMN "lastRunStatus" TEXT;

-- Notification enhancements
ALTER TABLE "Notification"
  ADD COLUMN "type" TEXT,
  ADD COLUMN "dataJson" TEXT,
  ADD COLUMN "readAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ALTER COLUMN "status" SET DEFAULT 'unread';

-- Execution log for automation
CREATE TABLE "AutomationExecutionLog" (
    "id" TEXT PRIMARY KEY,
    "ruleId" TEXT NOT NULL,
    "eventName" TEXT,
    "status" TEXT NOT NULL,
    "resultJson" TEXT,
    "errorMessage" TEXT,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationExecutionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
