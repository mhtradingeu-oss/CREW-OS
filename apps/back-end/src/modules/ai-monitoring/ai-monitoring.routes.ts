import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import {
  listAgentActivity,
  listEngineHealth,
  listPerformanceMetrics,
  listSafetyEvents,
  listSystemAlerts,
  listTokenUsage,
} from "./ai-monitoring.controller.js";

const router = Router();

router.get("/engine-health", requirePermission("ai:monitoring:read"), listEngineHealth);
router.get("/agent-activity", requirePermission("ai:monitoring:read"), listAgentActivity);
router.get("/token-usage", requirePermission("ai:monitoring:read"), listTokenUsage);
router.get("/performance-metrics", requirePermission("ai:monitoring:read"), listPerformanceMetrics);
router.get("/system-alerts", requirePermission("ai:monitoring:read"), listSystemAlerts);
router.get("/safety-events", requirePermission("ai:monitoring:read"), listSafetyEvents);

export { router };
