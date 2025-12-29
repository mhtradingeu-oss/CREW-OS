// Observability routes for Automation OS (Phase 7.1)
// Strictly read-only. See system prompt for architectural constraints.

import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import * as controller from "./automation.observability.controller.js";

const observabilityRouter = Router();

// GET /summary
observabilityRouter.get("/summary", requirePermission("automation:read"), controller.getSummary);

// GET /rule-versions/:ruleVersionId
observabilityRouter.get("/rule-versions/:ruleVersionId", requirePermission("automation:read"), controller.getRuleVersionMetrics);

// GET /failures
observabilityRouter.get("/failures", requirePermission("automation:read"), controller.getFailureBreakdown);

// GET /top
observabilityRouter.get("/top", requirePermission("automation:read"), controller.getTop);

export { observabilityRouter };
