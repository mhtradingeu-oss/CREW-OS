import { Router } from "express";
import * as controller from "./brand.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
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
  requireFeature("governance"),
  validateBody(createBrandSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("brand:update"),
  requireFeature("governance"),
  validateBody(updateBrandSchema),
  controller.update,
);
router.delete("/:id", requirePermission("brand:delete"), requireFeature("governance"), controller.remove);

router.get("/:id/identity", requirePermission("brand:read"), controller.getIdentity);
router.put(
  "/:id/identity",
  requirePermission("brand:update"),
  requireFeature("governance"),
  validateBody(brandIdentitySchema),
  controller.upsertIdentity,
);
router.post(
  "/:id/ai/identity",
  requirePermission(["brand:update", "ai:manage"]),
  requireFeature("aiInsights"),
  validateBody(brandAiIdentitySchema),
  controller.refreshIdentity,
);

router.get("/:id/rules", requirePermission("brand:read"), controller.getRules);
router.put(
  "/:id/rules",
  requirePermission("brand:update"),
  requireFeature("governance"),
  validateBody(brandRulesSchema),
  controller.upsertRules,
);

router.post(
  "/:id/ai/rules",
  requirePermission(["brand:update", "ai:manage"]),
  requireFeature("aiInsights"),
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
  requireFeature("aiInsights"),
  validateBody(brandAiConfigSchema),
  controller.upsertAiConfig,
);

export { router };
