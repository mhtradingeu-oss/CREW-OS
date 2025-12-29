import { Router } from "express";
import * as controller from "./ai-autonomy.controller.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requirePermission } from "../../core/security/rbac.js";
import { runAutonomyCycleSchema } from "./ai-autonomy.validators.js";

const router = Router();

router.get("/status", requirePermission("ai:read"), controller.status);
router.get("/pending", requirePermission("ai:read"), controller.pending);
router.post(
  "/approve/:taskId",
  requirePermission(["ai:run", "ai:autonomy:manage", "ai:manage"]),
  controller.approve,
);
router.post(
  "/reject/:taskId",
  requirePermission(["ai:run", "ai:autonomy:manage", "ai:manage"]),
  controller.reject,
);
router.post(
  "/run-cycle",
  requirePermission(["ai:run", "ai:autonomy:manage"]),
  validateBody(runAutonomyCycleSchema),
  controller.runCycle,
);
router.get("/config", requirePermission("ai:config:read"), controller.getConfig);
router.post(
  "/config",
  requirePermission("ai:config:update"),
  controller.updateConfig,
);

const debugRouter = Router();

debugRouter.get("/detectors", requirePermission(["ai:manage"]), controller.debugDetectors);
debugRouter.get("/task-plan", requirePermission(["ai:manage"]), controller.debugTaskPlan);
debugRouter.get("/executor", requirePermission(["ai:manage"]), controller.debugExecutor);
debugRouter.get("/loop", requirePermission(["ai:manage"]), controller.debugLoop);

export { router, debugRouter as autonomyDebugRouter };
