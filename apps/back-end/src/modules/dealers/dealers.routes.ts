import { Router } from "express";
import * as controller from "./dealers.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createDealersSchema, updateDealersSchema } from "./dealers.validators.js";
import { dealerAiInsightSchema } from "./dealers.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get("/kpi", requirePermission("dealers:stats"), controller.listKpis);
router.get("/:id/kpi", requirePermission("dealers:stats"), controller.getKpi);
router.post(
  "/:id/kpi/recalculate",
  requirePermission("dealers:manage"),
  controller.recalculateKpi,
);
router.get(
  "/dashboard/summary",
  requirePermission("dealers:stats"),
  controller.dashboardSummary,
);

router.get("/", requirePermission("dealers:read"), controller.list);
router.get("/:id", requirePermission("dealers:read"), controller.getById);
router.post(
  "/",
  requirePermission("dealers:create"),
  validateBody(createDealersSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("dealers:update"),
  validateBody(updateDealersSchema),
  controller.update,
);
router.delete("/:id", requirePermission("dealers:delete"), controller.remove);

router.post(
  "/ai/insights",
  requirePermission("dealers:stats"),
  requireFeature("dealer"),
  validateBody(dealerAiInsightSchema),
  controller.aiInsights,
);

export { router };
