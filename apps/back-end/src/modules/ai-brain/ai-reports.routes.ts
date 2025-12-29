import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./ai-insights.controller.js";
import { createReportSchema } from "./ai-brain.validators.js";

const router = Router();

router.post(
  "/",
  requirePermission(["ai:run", "ai:manage"]),
  validateBody(createReportSchema),
  controller.createReport,
);
router.get("/list", requirePermission("ai:read"), controller.listReports);
router.get("/:id", requirePermission("ai:read"), controller.getReport);
router.get("/:id/render", requirePermission("ai:read"), controller.getReportRendered);

export { router };
