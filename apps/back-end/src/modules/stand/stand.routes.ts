import { Router } from "express";
import * as controller from "./stand.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createStandSchema, standAiInsightSchema, updateStandSchema } from "./stand.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get(
  "/dashboard/summary",
  requirePermission("stand:read"),
  controller.dashboardSummary,
);
router.get("/", requirePermission("stand:read"), controller.list);
router.get("/:id", requirePermission("stand:read"), controller.getById);
router.post(
  "/",
  requirePermission("stand:create"),
  validateBody(createStandSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("stand:update"),
  validateBody(updateStandSchema),
  controller.update,
);
router.delete("/:id", requirePermission("stand:delete"), controller.remove);

router.post(
  "/ai/insights",
  requirePermission("stand:read"),
  requireFeature("stand"),
  validateBody(standAiInsightSchema),
  controller.aiInsights,
);

export { router };
