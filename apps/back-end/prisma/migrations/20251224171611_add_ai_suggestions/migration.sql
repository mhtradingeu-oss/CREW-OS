-- CreateEnum
CREATE TYPE "AISuggestionStatus" AS ENUM ('pending', 'approved', 'rejected', 'executed', 'failed');

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "suggestionType" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" "AISuggestionStatus" NOT NULL DEFAULT 'pending',
    "requiredApprovalRole" TEXT NOT NULL,
    "inputSnapshotJson" TEXT NOT NULL,
    "proposedOutputJson" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "correlationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AISuggestion_tenantId_idx" ON "AISuggestion"("tenantId");

-- CreateIndex
CREATE INDEX "AISuggestion_brandId_idx" ON "AISuggestion"("brandId");

-- CreateIndex
CREATE INDEX "AISuggestion_status_idx" ON "AISuggestion"("status");

-- CreateIndex
CREATE INDEX "AISuggestion_correlationId_idx" ON "AISuggestion"("correlationId");
