import { Router } from "express";
import * as controller from "./brand.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import { FEATURES } from "../../core/security/feature-registry.js";
import {
  brandAiConfigSchema,
  brandAiIdentitySchema,
  brandIdentitySchema,
  createBrandSchema,
  brandRulesSchema,
  updateBrandSchema,
} from "./brand.validators.js";

const router = Router();
router.get("/", requirePermission("brand:read"), controller.list);
router.get("/me", requirePermission("brand:read"), controller.getCurrentBrand);
router.get("/:id", requirePermission("brand:read"), controller.getById);
router.post(
  "/",
  requirePermission("brand:create"),
  requireFeature(FEATURES.GOVERNANCE),
  validateBody(createBrandSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("brand:update"),
  requireFeature(FEATURES.GOVERNANCE),
  validateBody(updateBrandSchema),
  controller.update,
);
router.delete("/:id", requirePermission("brand:delete"), requireFeature(FEATURES.GOVERNANCE), controller.remove);
router.delete("/:id", requirePermission("brand:delete"), requireFeature(FEATURES.GOVERNANCE), controller.remove);

router.get("/:id/identity", requirePermission("brand:read"), controller.getIdentity);
router.put(
  "/:id/identity",
  requirePermission("brand:update"),
  requireFeature(FEATURES.GOVERNANCE),
  validateBody(brandIdentitySchema),
  controller.upsertIdentity,
);
router.post(
  "/:id/ai/identity",
  requirePermission(["brand:update", "ai:manage"]),
  requireFeature(FEATURES.AI_INSIGHTS),
  validateBody(brandAiIdentitySchema),
  controller.refreshIdentity,
);

router.get("/:id/rules", requirePermission("brand:read"), controller.getRules);
router.put(
  "/:id/rules",
  requirePermission("brand:update"),
  requireFeature(FEATURES.GOVERNANCE),
  validateBody(brandRulesSchema),
  controller.upsertRules,
);

router.post(
  "/:id/ai/rules",
  requirePermission(["brand:update", "ai:manage"]),
  requireFeature(FEATURES.AI_INSIGHTS),
  validateBody(brandAiIdentitySchema),
  controller.refreshRules,
);

router.get(
  "/:id/ai/config",
  requirePermission(["brand:read", "ai:manage"]),
  controller.getAiConfig,
);
router.put(
  "/:id/ai/config",
  requirePermission(["brand:update", "ai:manage"]),
  requireFeature(FEATURES.AI_INSIGHTS),
  validateBody(brandAiConfigSchema),
  controller.upsertAiConfig,
);

export { router };
