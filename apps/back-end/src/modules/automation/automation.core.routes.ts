import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import { featureTelemetry } from "../../core/http/middleware/feature-telemetry.js";
import { FEATURES } from "../../core/security/feature-registry.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { executeAutomationEvent } from "./automation.core.controller.js";
import { executeAutomationEventSchema } from "./automation.core.validators.js";

const router = Router();

router.post(
  "/",
  requirePermission("automation:execute"),
  requireFeature(FEATURES.AUTOMATION),
  featureTelemetry(FEATURES.AUTOMATION),
  validateBody(executeAutomationEventSchema),
  executeAutomationEvent,
);

export { router as automationCoreRouter };
