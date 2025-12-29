import { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

export async function createVoiceSession(data: Prisma.VoiceSessionUncheckedCreateInput) {
  return prisma.voiceSession.create({ data });
}

export async function createVoiceTranscript(data: Prisma.VoiceTranscriptUncheckedCreateInput) {
  return prisma.voiceTranscript.create({ data });
}

export async function findVoiceSessionWithTranscripts(sessionId: string) {
  return prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: { transcripts: { orderBy: { createdAt: "asc" } } },
  });
}

export async function findVoiceSessionWithDetails(sessionId: string) {
  return prisma.voiceSession.findUnique({
    where: { id: sessionId },
    include: {
      transcripts: { orderBy: { createdAt: "asc" } },
      ticket: true,
    },
  });
}

export async function updateVoiceSession(sessionId: string, data: Prisma.VoiceSessionUpdateInput) {
  return prisma.voiceSession.update({ where: { id: sessionId }, data });
}
