import { z } from "zod";

export const createCrmSchema = z.object({
  brandId: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  ownerId: z.string().optional(),
  sourceId: z.string().optional(),
});

export const updateCrmSchema = createCrmSchema.partial();

export const crmScoreSchema = z.object({
  intent: z.string().trim().min(1).optional(),
});

export const crmFollowupSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  leadId: z.string().trim().min(1),
  goal: z.string().trim().min(1).optional(),
});

export const convertLeadToContactSchema = z.object({
  ownerId: z.string().trim().min(1).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const convertLeadToCustomerSchema = z
  .object({
    ownerId: z.string().trim().min(1).optional(),
    orderId: z.string().trim().min(1).optional(),
    revenueRecordId: z.string().trim().min(1).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => Boolean(value.orderId) || Boolean(value.revenueRecordId), {
    message: "orderId or revenueRecordId is required",
  });

const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), "Must be a valid ISO date")
  .optional();

const segmentFilterSchema = z.object({
  statuses: z.array(z.string().trim().min(1)).optional(),
  sourceIds: z.array(z.string().trim().min(1)).optional(),
  ownerIds: z.array(z.string().trim().min(1)).optional(),
  minScore: z.coerce.number().optional(),
  maxScore: z.coerce.number().optional(),
  createdAfter: dateString,
  createdBefore: dateString,
});

export const createSegmentSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  filter: segmentFilterSchema.optional(),
});

export const updateSegmentSchema = createSegmentSchema.partial();
