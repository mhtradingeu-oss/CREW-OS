import { prisma, type PrismaArgs } from "../../prisma.js";

type SortOrder = "asc" | "desc";

type TicketListArgs = PrismaArgs<typeof prisma.ticket.findMany>;
type TicketDetailArgs = PrismaArgs<typeof prisma.ticket.findFirst>;
type TicketCreateArgs = PrismaArgs<typeof prisma.ticket.create>;
type TicketUpdateArgs = PrismaArgs<typeof prisma.ticket.update>;
type TicketMessageCreateArgs = PrismaArgs<typeof prisma.ticketMessage.create>;
type TicketMessageFindManyArgs = PrismaArgs<typeof prisma.ticketMessage.findMany>;
type TicketAssignmentCreateArgs = PrismaArgs<typeof prisma.ticketAssignment.create>;

type VoiceSessionFindManyArgs = PrismaArgs<typeof prisma.voiceSession.findMany>;
type VoiceSessionFindFirstArgs = PrismaArgs<typeof prisma.voiceSession.findFirst>;
type VoiceTranscriptFindManyArgs = PrismaArgs<typeof prisma.voiceTranscript.findMany>;

export type TicketListSelect = TicketListArgs["select"];
export type TicketListRecord = Awaited<ReturnType<typeof prisma.ticket.findMany>>[number];
export type TicketWhereInput = TicketListArgs["where"];
export type TicketDetailSelect = TicketDetailArgs["select"];
export type TicketDetailRecord = Awaited<ReturnType<typeof prisma.ticket.findFirst>>;
export type TicketMessageRecord = Awaited<ReturnType<typeof prisma.ticketMessage.findMany>>[number];
export type TicketMessageSelect = TicketMessageFindManyArgs["select"];
export type TicketAssignmentRecord = Awaited<ReturnType<typeof prisma.ticketAssignment.create>>;
export type VoiceSessionListSelect = VoiceSessionFindManyArgs["select"];
export type VoiceSessionInclude = VoiceSessionFindManyArgs["include"];
export type VoiceSessionListRecord = Awaited<ReturnType<typeof prisma.voiceSession.findMany>>[number];
export type VoiceSessionRecord = Awaited<ReturnType<typeof prisma.voiceSession.findFirst>>;
export type VoiceSessionWhereInput = VoiceSessionFindManyArgs["where"];
export type VoiceTranscriptSelect = VoiceTranscriptFindManyArgs["select"];
export type VoiceTranscriptRecord = Awaited<ReturnType<typeof prisma.voiceTranscript.findMany>>[number];

export async function listTickets(args: TicketListArgs) {
  const { where, ...rest } = args;
  const [total, rows] = await prisma.$transaction([
    prisma.ticket.count({ where }),
    prisma.ticket.findMany({ where, ...rest }),
  ]);
  return { total, rows };
}

export async function countTickets(where?: TicketListArgs["where"]) {
  return prisma.ticket.count({ where });
}

export async function findTicket(args: TicketDetailArgs) {
  return prisma.ticket.findFirst(args);
}

export async function findTicketMinimal(where: TicketDetailArgs["where"]) {
  return prisma.ticket.findFirst({
    where,
    select: { id: true, brandId: true },
  });
}

export async function createTicket(args: TicketCreateArgs) {
  return prisma.ticket.create(args);
}

export async function updateTicket(args: TicketUpdateArgs) {
  return prisma.ticket.update(args);
}

export async function listTicketMessages(args: TicketMessageFindManyArgs) {
  return prisma.ticketMessage.findMany(args);
}

export async function createTicketMessage(args: TicketMessageCreateArgs) {
  return prisma.ticketMessage.create(args);
}

export async function createTicketAssignment(args: TicketAssignmentCreateArgs) {
  return prisma.ticketAssignment.create(args);
}

export async function countVoiceSessions(where?: VoiceSessionFindManyArgs["where"]) {
  return prisma.voiceSession.count({ where });
}

export async function listVoiceSessions(args: VoiceSessionFindManyArgs) {
  return prisma.voiceSession.findMany(args);
}

export async function findVoiceSession(args: VoiceSessionFindFirstArgs) {
  return prisma.voiceSession.findFirst(args);
}

export async function findRecentTickets(brandId: string, limit = 5) {
  return prisma.ticket.findMany({
    where: { brandId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 3 },
      tags: true,
    },
  });
}

export async function findTicketWithMessages(ticketId: string, options?: { order?: SortOrder; take?: number }) {
  return prisma.ticket.findUnique({
    where: { id: ticketId },
    include: {
      messages: Object.assign(
        {
          orderBy: { createdAt: options?.order ?? "asc" },
        },
        options?.take ? { take: options.take } : {},
      ),
      tags: true,
    },
  });
}
