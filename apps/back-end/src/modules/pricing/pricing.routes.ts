import { Router } from "express";
import * as controller from "./pricing.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import { featureTelemetry } from "../../core/http/middleware/feature-telemetry.js";
import { FEATURES } from "../../core/security/feature-registry.js";
import {
  competitorPriceSchema,
  createPricingDraftSchema,
  createPricingSchema,
  pricingDraftApprovalSchema,
  pricingDraftRejectionSchema,
  pricingSuggestionSchema,
  updatePricingSchema,
} from "./pricing.validators.js";

const router = Router();


// All routes now enforce feature flag and plan entitlement
router.get(
  "/",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:read"),
  controller.list,
);
router.get(
  "/product/:productId/drafts",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:read"),
  controller.listDrafts,
);
router.post(
  "/product/:productId/drafts",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:update"),
  validateBody(createPricingDraftSchema),
  controller.createDraft,
);
router.get(
  "/product/:productId/competitors",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:read"),
  controller.listCompetitorPrices,
);
router.post(
  "/product/:productId/competitors",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:update"),
  validateBody(competitorPriceSchema),
  controller.addCompetitorPrice,
);
router.get(
  "/product/:productId/logs",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:read"),
  controller.listLogs,
);
router.post(
  "/product/:productId/ai/suggest",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission(["ai:pricing", "pricing:update"]),
  validateBody(pricingSuggestionSchema),
  controller.suggestPrice,
);
router.post(
  "/product/:productId/ai/plan",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission(["ai:pricing", "pricing:update"]),
  validateBody(pricingSuggestionSchema),
  controller.aiPlan,
);
router.post(
  "/product/:productId/drafts/:draftId/submit",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:update"),
  controller.submitDraft,
);
router.post(
  "/product/:productId/drafts/:draftId/approve",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:approve"),
  validateBody(pricingDraftApprovalSchema),
  controller.approveDraft,
);
router.post(
  "/product/:productId/drafts/:draftId/reject",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:approve"),
  validateBody(pricingDraftRejectionSchema),
  controller.rejectDraft,
);
router.get(
  "/:id",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:read"),
  controller.getById,
);
router.post(
  "/",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:create"),
  validateBody(createPricingSchema),
  controller.create,
);
router.put(
  "/:id",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:update"),
  validateBody(updatePricingSchema),
  controller.update,
);
router.delete(
  "/:id",
  requireFeature(FEATURES.PRICING),
  featureTelemetry(FEATURES.PRICING),
  requirePermission("pricing:delete"),
  controller.remove,
);

export { router };
