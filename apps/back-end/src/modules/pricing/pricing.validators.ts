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
