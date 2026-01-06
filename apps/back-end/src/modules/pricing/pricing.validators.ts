import { z } from "zod";
import {
  competitorPriceCreateSchema,
  createPricingInputSchema,
  pricingDraftApprovalSchema as pricingDraftApprovalSchemaShared,
  pricingDraftCreateSchema,
  pricingDraftRejectionSchema as pricingDraftRejectionSchemaShared,
  pricingListQuerySchema,
  pricingPlanInputSchema,
  pricingPlanOutputSchema,
  pricingSuggestionInputSchema,
  pricingSuggestionOutputSchema,
  pricingRecordSchema,
  updatePricingInputSchema,
} from "@mh-os/shared";

const isoDateString = z.union([z.string(), z.date()]);
const money = z.coerce.number().nonnegative();

const pricingOsDraftBaseSchema = pricingDraftCreateSchema.extend({
  productId: z.string().trim().min(1),
  currency: z.string().trim().length(3),
  mapPrice: money.optional(),
  marginTarget: money.optional(),
  guardrailMinMargin: money.optional(),
  guardrailMaxDiscount: money.optional(),
  effectiveFrom: isoDateString.optional(),
  effectiveTo: isoDateString.optional(),
});

export const createPriceDraftSchema = pricingOsDraftBaseSchema;
export const updatePriceDraftSchema = z.object({
  brandId: z.string().trim().min(1).optional(),
  currency: z.string().trim().length(3).optional(),
  channel: z.string().trim().min(1).optional(),
  oldNet: money.optional(),
  newNet: money.optional(),
  status: z.string().trim().min(1).optional(),
  statusReason: z.string().trim().min(1).optional(),
  mapPrice: money.optional(),
  marginTarget: money.optional(),
  guardrailMinMargin: money.optional(),
  guardrailMaxDiscount: money.optional(),
  effectiveFrom: isoDateString.optional(),
  effectiveTo: isoDateString.optional(),
});
export const publishPriceDraftSchema = z.object({
  approvedById: z.string().trim().min(1).optional(),
});

// Re-export shared schemas with legacy names expected by controllers/services
export const createPricingSchema = createPricingInputSchema;
export const updatePricingSchema = updatePricingInputSchema;
export const createPricingDraftSchema = pricingDraftCreateSchema;
export const competitorPriceSchema = competitorPriceCreateSchema;
export const listPricingSchema = pricingListQuerySchema;
export const pricingSuggestionSchema = pricingSuggestionInputSchema;
export const pricingDraftApprovalSchema = pricingDraftApprovalSchemaShared;
export const pricingDraftRejectionSchema = pricingDraftRejectionSchemaShared;
export const pricingPlanSchema = pricingPlanInputSchema;
export const pricingPlanOutputSchemaRef = pricingPlanOutputSchema;
export const pricingRecordSchemaRef = pricingRecordSchema;
