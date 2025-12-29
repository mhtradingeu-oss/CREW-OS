import { z } from "zod";

export const createTicketSchema = z.object({
  brandId: z.string().min(1),
  createdByUserId: z.string().min(1),
  contactId: z.string().optional(),
  channel: z.string().optional(),
  locale: z.string().optional(),
  source: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  status: z.string().optional(),
  assignedToUserId: z.string().optional(),
  content: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const addTicketMessageSchema = z.object({
  senderId: z.string().min(1),
  content: z.string().min(1),
  locale: z.string().optional(),
});

export const updateTicketStatusSchema = z.object({
  brandId: z.string().min(1),
  status: z.string().min(1),
  closedAt: z.coerce.date().optional(),
});

export const assignTicketSchema = z.object({
  assigneeUserId: z.string().min(1),
  brandAssignmentScope: z.string().optional(),
  role: z.string().optional(),
});

export const closeTicketSchema = z.object({
  brandId: z.string().min(1),
  status: z.string().optional().default("CLOSED"),
  closedAt: z.coerce.date().optional(),
});

export const startVoiceSessionSchema = z.object({
  brandId: z.string().optional(),
  tenantId: z.string().optional(),
  ticketId: z.string().optional(),
  channel: z.string().optional(),
  locale: z.string().optional(),
});

export const voiceTurnSchema = z
  .object({
    audioUrl: z.string().url().optional(),
    audioBase64: z.string().optional(),
    locale: z.string().optional(),
  })
  .refine((value) => Boolean(value.audioUrl || value.audioBase64), {
    message: "audioUrl or audioBase64 is required",
    path: ["audioUrl"],
  });

export const endVoiceSessionSchema = z.object({
  locale: z.string().optional(),
});

export const supportTriageSchema = z.object({
  ticketId: z.string().min(1).optional(),
  brandId: z.string().optional(),
  goal: z.string().trim().min(1).optional(),
});
