import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as brainController from "./ai-brain.controller.js";
import * as controller from "./ai-insights.controller.js";
import { refreshInsightsSchema } from "./ai-insights.validators.js";
import { createInsightSchema } from "./ai-brain.validators.js";

const router = Router();

router.post(
  "/",
  requirePermission(["ai:insights", "ai-brain:read"]),
  validateBody(createInsightSchema),
  brainController.createInsight,
);
router.post(
  "/refresh",
  requirePermission(["ai:run", "ai:manage"]),
  validateBody(refreshInsightsSchema),
  controller.refresh,
);
router.get("/kpi/summary", requirePermission("ai:read"), controller.kpiSummary);
router.get("/", requirePermission(["ai:read", "ai:insights:read"]), controller.list);
router.get("/:id", requirePermission(["ai:read", "ai:insights:read"]), controller.getById);

export { router };
