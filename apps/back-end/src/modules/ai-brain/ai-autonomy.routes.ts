import { Router } from "express";
import * as controller from "./ai-autonomy.controller.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requirePermission } from "../../core/security/rbac.js";
import { requirePlanFeature } from "../../core/http/middleware/plan-gating.js";
import { FEATURES } from "../../core/security/feature-registry.js";
import { emitEvent } from "../../core/events/event-bus.js";
import { runAutonomyCycleSchema } from "./ai-autonomy.validators.js";

const router = Router();

// Automation entry guard: feature, plan, permission, audit
router.use(async (req, res, next) => {
  try {
    await requirePlanFeature(FEATURES.AUTOMATION)(req, res, async (err) => {
      if (err) {
        await emitEvent("automation.run.denied", {
          reason: err.message,
          actorId: req.user?.id,
          tenantId: req.user?.tenantId,
          source: "ai",
        }, { module: "automation", actorUserId: req.user?.id, tenantId: req.user?.tenantId, source: "ai" });
        return res.status(403).json({ error: err.message, code: err.code || "AUTOMATION_DENIED" });
      }
      await emitEvent("automation.run.requested", {
        actorId: req.user?.id,
        tenantId: req.user?.tenantId,
        source: "ai",
      }, { module: "automation", actorUserId: req.user?.id, tenantId: req.user?.tenantId, source: "ai" });
      next();
    });
  } catch (e) {
    next(e);
  }
});

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
