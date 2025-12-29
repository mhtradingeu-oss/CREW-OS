import { z } from "zod";

export const createAffiliateSchema = z.object({
  name: z.string().optional(),
});

export const updateAffiliateSchema = createAffiliateSchema.partial();

export const createConversionSchema = z.object({
  affiliateId: z.string(),
  orderId: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createPayoutRequestSchema = z.object({
  affiliateId: z.string(),
  amount: z.number().nonnegative(),
  currency: z.string().optional(),
  method: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePayoutStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "PAID"]),
  notes: z.string().optional(),
});
