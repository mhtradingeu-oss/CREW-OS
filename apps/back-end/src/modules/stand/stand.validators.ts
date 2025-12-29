import { z } from "zod";

export const createStandSchema = z.object({
  name: z.string().optional(),
});

export const updateStandSchema = createStandSchema.partial();

export const standAiInsightSchema = z.object({
  brandId: z.string().trim().min(1),
  standPartnerId: z.string().trim().min(1),
  topic: z.string().trim().min(3).max(500).optional(),
});
