import { Router } from "express";
import * as controller from "./marketing.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  campaignAttributionSchema,
  campaignInteractionSchema,
  createMarketingSchema,
  marketingIdeaSchema,
  updateMarketingSchema,
  campaignExecutionSchema,
} from "./marketing.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import { featureTelemetry } from "../../core/http/middleware/feature-telemetry.js";

const router = Router();

router.get("/", requirePermission("marketing:read"), controller.list);
router.get("/:id", requirePermission("marketing:read"), controller.getById);
router.get("/:id/preview-targets", requirePermission("marketing:read"), controller.previewTargets);
router.post(
  "/",
  requirePermission("marketing:create"),
  validateBody(createMarketingSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("marketing:update"),
  validateBody(updateMarketingSchema),
  controller.update,
);
router.delete("/:id", requirePermission("marketing:delete"), controller.remove);
router.post(
  "/:id/attribution",
  requirePermission("marketing:update"),
  validateBody(campaignAttributionSchema),
  controller.linkLeadToCampaign,
);
router.post(
  "/:id/interactions",
  requirePermission("marketing:update"),
  validateBody(campaignInteractionSchema),
  controller.recordCampaignInteraction,
);
router.post(
  "/:id/execution",
  requirePermission("marketing:update"),
  validateBody(campaignExecutionSchema),
  controller.recordExecution,
);
router.post(
  "/ai/generate",
  requirePermission(["ai:marketing", "marketing:update"]),
  requireFeature("marketing"),
  featureTelemetry("marketing"),
  controller.generateContent,
);
router.post(
  "/ai/seo",
  requirePermission(["ai:marketing", "marketing:update"]),
  requireFeature("marketing"),
  featureTelemetry("marketing"),
  controller.generateSeo,
);
router.post(
  "/ai/captions",
  requirePermission(["ai:marketing", "marketing:update"]),
  requireFeature("marketing"),
  controller.generateCaptions,
);
router.post(
  "/ai/ideas",
  requirePermission(["ai:marketing", "marketing:update"]),
  requireFeature("marketing"),
  validateBody(marketingIdeaSchema),
  controller.generateIdeas,
);
router.get("/:id/performance", requirePermission("marketing:read"), controller.getPerformance);
router.get("/:id/activity", requirePermission("marketing:read"), controller.getActivity);

export { router };
