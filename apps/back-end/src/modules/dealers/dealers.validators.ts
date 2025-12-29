import { z } from "zod";

export const createDealersSchema = z.object({
  name: z.string().optional(),
});

export const updateDealersSchema = createDealersSchema.partial();

export const dealerAiInsightSchema = z.object({
  brandId: z.string().trim().min(1),
  partnerId: z.string().trim().min(1),
  topic: z.string().trim().min(3).max(500).optional(),
});
