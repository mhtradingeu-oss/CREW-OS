
import { Router } from "express";
import * as controller from "./automation.controller.js";
import { executeAction } from "./automation.execution.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import { createAutomationSchema, updateAutomationSchema } from "./automation.validators.js";
import { executeAutomationSchema } from "./automation.execution.validators.js";
import { observabilityRouter as automationObservabilityRouter } from "./automation.observability.routes.js";
import { automationExplainRouter } from "./automation.explain.routes.js";

const router = Router();


router.get("/", requirePermission("automation:read"), controller.list);
router.get("/:id", requirePermission("automation:read"), controller.getById);
router.post(
  "/",
  requirePermission("automation:create"),
  validateBody(createAutomationSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("automation:update"),
  validateBody(updateAutomationSchema),
  controller.update,
);
router.delete("/:id", requirePermission("automation:delete"), controller.remove);
router.post("/run-scheduled", requirePermission("automation:run"), controller.runScheduled);
router.post("/:id/run", requirePermission("automation:run"), controller.runNow);
router.post(
  "/execute",
  requirePermission(["automation:execute", "ai:approvals:read"]),
  requireFeature("automation"),
  validateBody(executeAutomationSchema),
  executeAction,
);


// Observability sub-router (strictly read-only)
router.use(
  "/observability",
  automationObservabilityRouter
);

// Explainability sub-router (strictly read-only)
router.use(
  "/explain",
  automationExplainRouter
);

export { router };
