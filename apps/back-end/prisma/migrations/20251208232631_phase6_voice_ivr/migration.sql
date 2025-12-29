-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "channel" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "metadataJson" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateTable
CREATE TABLE "VoiceSession" (
    "id" TEXT NOT NULL,
    "brandId" TEXT,
    "tenantId" TEXT,
    "ticketId" TEXT,
    "channel" TEXT,
    "locale" TEXT,
    "status" TEXT DEFAULT 'ONGOING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "summary" TEXT,
    "sentiment" TEXT,
    "tagsJson" TEXT,
    "handoffTarget" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoiceTranscript" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT,
    "text" TEXT,
    "audioUrl" TEXT,
    "locale" TEXT,
    "actionJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceTranscript_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceSession_brandId_idx" ON "VoiceSession"("brandId");

-- CreateIndex
CREATE INDEX "VoiceSession_tenantId_idx" ON "VoiceSession"("tenantId");

-- CreateIndex
CREATE INDEX "VoiceSession_ticketId_idx" ON "VoiceSession"("ticketId");

-- CreateIndex
CREATE INDEX "VoiceTranscript_sessionId_idx" ON "VoiceTranscript"("sessionId");

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceSession" ADD CONSTRAINT "VoiceSession_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoiceTranscript" ADD CONSTRAINT "VoiceTranscript_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "VoiceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
