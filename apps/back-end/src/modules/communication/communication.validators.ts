import { z } from "zod";

export const createCommunicationSchema = z.object({
  brandId: z.string().min(1),
  code: z.string().min(1),
  channel: z.string().min(1),
  subject: z.string().optional(),
  body: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});

export const updateCommunicationSchema = z.object({
  brandId: z.string().min(1),
  channel: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  brandId: z.string().min(1),
  channel: z.enum(["email", "sms"]),
  recipient: z.string().min(1),
  templateId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  variables: z.record(z.string(), z.unknown()).optional(),
});
