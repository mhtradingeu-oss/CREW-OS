import { z } from "zod";

const segmentIdArray = z.array(z.string().trim().min(1));

export const createMarketingSchema = z.object({
  brandId: z.string().optional(),
  channelId: z.string().optional(),
  name: z.string().min(1),
  objective: z.string().optional(),
  budget: z.number().optional(),
  status: z.string().optional(),
  targetSegmentIds: segmentIdArray.optional(),
});

export const updateMarketingSchema = createMarketingSchema.partial();

export const marketingIdeaSchema = z.object({
  brandId: z.string().trim().min(1),
  goal: z.string().trim().min(1),
  channels: z.array(z.string().trim().min(1)).optional(),
  audience: z.string().trim().min(1).optional(),
});

export const campaignAttributionSchema = z
  .object({
    leadId: z.string().trim().min(1).optional(),
    customerId: z.string().trim().min(1).optional(),
    source: z.string().trim().max(128).optional(),
  })
  .refine((value) => Boolean(value.leadId) || Boolean(value.customerId), {
    message: "leadId or customerId is required",
  });

export const campaignInteractionSchema = z
  .object({
    type: z.enum(["view", "conversion"]),
    leadId: z.string().trim().min(1).optional(),
    customerId: z.string().trim().min(1).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine((value) => Boolean(value.leadId) || Boolean(value.customerId), {
    message: "leadId or customerId is required",
  });
