import { z } from "zod";

export const insightsQuerySchema = z.object({
  tenantId: z.string().optional(),
  brandId: z.string().optional(),
  partnerId: z.string().optional(),
  featureCode: z.string().optional(),
  insightType: z.string().optional(),
  crew: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(200).optional(),
});

export const recommendationsQuerySchema = z.object({
  tenantId: z.string().optional(),
  brandId: z.string().optional(),
  partnerId: z.string().optional(),
  featureCode: z.string().optional(),
  crew: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).optional(),
  pageSize: z.coerce.number().min(1).max(200).optional(),
});
