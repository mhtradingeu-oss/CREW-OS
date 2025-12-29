
import { z } from "zod";

const isoDateString = z.union([z.string(), z.date()]);
const money = z.coerce.number().nonnegative();

// Full draft DTO with id for frontend display
export const pricingDraftSchema = z.object({
  id: z.string(),
  brandId: z.string().trim().min(1).optional(),
  channel: z.string().trim().min(1),
  oldNet: money,
  newNet: money,
  status: z.string().trim().min(1).optional(),
  statusReason: z.string().trim().min(1).optional(),
  createdById: z.string().trim().min(1).optional(),
  approvedById: z.string().trim().min(1).optional(),
  createdAt: isoDateString.optional(),
});
export type PricingDraftDto = z.infer<typeof pricingDraftSchema>;

// Full competitor price DTO with id for frontend display
export const competitorPriceSchema = z.object({
  id: z.string(),
  brandId: z.string().trim().min(1).optional(),
  competitor: z.string().trim().min(1),
  marketplace: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  priceNet: money,
  priceGross: money,
  currency: z.string().trim().length(3).optional(),
  collectedAt: isoDateString.optional(),
});
export type CompetitorPriceDto = z.infer<typeof competitorPriceSchema>;

export const pricingListQuerySchema = z.object({
  productId: z.string().trim().min(1).optional(),
  brandId: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});
export type PricingListQueryDto = z.infer<typeof pricingListQuerySchema>;

export const pricingRecordSchema = z.object({
  id: z.string(),
  productId: z.string(),
  brandId: z.string().optional().nullable(),
  basePrice: money,
  cost: money,
  margin: z.coerce.number(),
  currency: z.string().trim().min(1),
  notes: z.string().optional(),
  createdAt: isoDateString.optional(),
  updatedAt: isoDateString.optional(),
});
export type PricingRecordDto = z.infer<typeof pricingRecordSchema>;

export const createPricingInputSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  productId: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  basePrice: money,
  cost: money,
  margin: money.optional(),
  notes: z.string().optional(),
});
export type CreatePricingInputDto = z.infer<typeof createPricingInputSchema>;

export const updatePricingInputSchema = z.object({
  priceId: z.string().trim().min(1).optional(),
  currency: z.string().trim().min(1).optional(),
  basePrice: money.optional(),
  cost: money.optional(),
  notes: z.string().optional(),
});
export type UpdatePricingInputDto = z.infer<typeof updatePricingInputSchema>;

export const pricingDraftCreateSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  channel: z.string().trim().min(1),
  oldNet: money,
  newNet: money,
  status: z.string().trim().min(1).optional(),
  statusReason: z.string().trim().min(1).optional(),
  createdById: z.string().trim().min(1).optional(),
  approvedById: z.string().trim().min(1).optional(),
});
export type PricingDraftCreateDto = z.infer<typeof pricingDraftCreateSchema>;

export const pricingDraftApprovalSchema = z.object({
  approvedById: z.string().trim().min(1).optional(),
});
export type PricingDraftApprovalDto = z.infer<typeof pricingDraftApprovalSchema>;

export const pricingDraftRejectionSchema = z.object({
  reason: z.string().trim().min(1).optional(),
});
export type PricingDraftRejectionDto = z.infer<typeof pricingDraftRejectionSchema>;

export const competitorPriceCreateSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  competitor: z.string().trim().min(1),
  marketplace: z.string().trim().min(1).optional(),
  country: z.string().trim().min(1).optional(),
  priceNet: money,
  priceGross: money,
  currency: z.string().trim().length(3).optional(),
  collectedAt: isoDateString.optional(),
});
export type CompetitorPriceCreateDto = z.infer<typeof competitorPriceCreateSchema>;

export const pricingLogEntrySchema = z.object({
  id: z.string(),
  productId: z.string(),
  brandId: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  oldNet: z.number().nullable(),
  newNet: z.number().nullable(),
  aiAgent: z.string().optional().nullable(),
  confidenceScore: z.number().nullable(),
  summary: z.string().optional().nullable(),
  createdAt: isoDateString,
});
export type PricingLogEntryDto = z.infer<typeof pricingLogEntrySchema>;

export const pricingSuggestionInputSchema = z.object({
  strategy: z.string().trim().min(1).optional(),
  requireApproval: z.boolean().optional(),
  market: z.string().trim().min(1).optional(),
  competitors: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        price: money,
      }),
    )
    .optional(),
});
export type PricingSuggestionInputDto = z.infer<typeof pricingSuggestionInputSchema>;

export const pricingSuggestionOutputSchema = z.object({
  suggestedPrice: z.number().nullable(),
  reasoning: z.string(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]),
  competitorSummary: z.string().optional(),
  confidenceScore: z.number().optional(),
  currentNet: z.number().nullable().optional(),
  strategy: z.string().nullable().optional(),
  market: z.string().nullable().optional(),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        price: z.number(),
      }),
    )
    .optional(),
});
export type PricingSuggestionOutputDto = z.infer<typeof pricingSuggestionOutputSchema>;

export const pricingPlanInputSchema = pricingSuggestionInputSchema;
export type PricingPlanInputDto = z.infer<typeof pricingPlanInputSchema>;

export const pricingPlanOutputSchema = z.object({
  output: z.unknown(),
  status: z.string().optional(),
  autonomy: z.unknown().optional(),
  runId: z.string().optional(),
});
export type PricingPlanOutputDto = z.infer<typeof pricingPlanOutputSchema>;

export function paginatedResponseSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
  });
}
