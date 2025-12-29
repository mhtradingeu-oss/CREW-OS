import { z } from "zod";

const standLocationSchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  geoLocationJson: z.string().optional(),
});

export const createStandSchema = z.object({
  standPartnerId: z.string().trim().min(1),
  brandId: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  standType: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  initialLocation: standLocationSchema.optional(),
});

export const updateStandSchema = createStandSchema.partial();

export const standListSchema = z.object({
  brandId: z.string().optional(),
  partnerId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createRefillSchema = z.object({
  standLocationId: z.string().trim().min(1),
  expectedAt: z.string().datetime().optional(),
  partnerId: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1),
        quantity: z.coerce.number().int().min(1),
        cost: z.number().positive().optional(),
        refillSource: z.string().optional(),
      }),
    )
    .min(1),
});

export const standAiStockSchema = z.object({
  brandId: z.string().trim().optional(),
  scope: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});
