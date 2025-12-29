import { z } from "zod";

export const createLoyaltySchema = z.object({
  brandId: z.string().optional(),
  programId: z.string(),
  userId: z.string().optional(),
  personId: z.string().optional(),
  pointsBalance: z.number().int().optional(),
  tier: z.string().optional(),
});

export const updateLoyaltySchema = createLoyaltySchema
  .extend({
    pointsDelta: z.number().int().optional(),
    reason: z.string().optional(),
  })
  .partial();

export const createProgramSchema = z.object({
  brandId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.string().optional(),
});

export const createTierSchema = z.object({
  name: z.string().min(1),
  minPoints: z.number().int().nonnegative(),
  maxPoints: z.number().int().nonnegative().optional(),
  benefitsDescription: z.string().optional(),
});

export const createRewardSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  pointsCost: z.number().int().nonnegative(),
  rewardType: z.string().optional(),
  payloadJson: z.union([z.string(), z.record(z.unknown())]).optional(),
});

export const redeemRewardSchema = z.object({
  customerId: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const loyaltyAiInsightSchema = z.object({
  brandId: z.string().trim().min(1),
  loyaltyCustomerId: z.string().trim().min(1),
  topic: z.string().trim().min(3).max(500).optional(),
});
