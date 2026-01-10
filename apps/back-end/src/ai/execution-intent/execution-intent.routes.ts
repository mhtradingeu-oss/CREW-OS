// PHASE 8.0 LOCK: ExecutionIntent Routes (NO EXECUTION, NO DB)
import { Router } from 'express';
import { executionIntentController } from './execution-intent.controller.js';
import { authenticateRequest } from '../../core/security/auth-middleware.js';
import { requirePermission } from '../../core/security/rbac.js';
import { requirePlanFeature } from '../../core/http/middleware/plan-gating.js';
import { FEATURES } from '../../core/security/feature-registry.js';
import { emitEvent } from '../../core/events/event-bus.js';

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
          source: "api",
        }, { module: "automation", actorUserId: req.user?.id, tenantId: req.user?.tenantId, source: "api" });
        return res.status(403).json({ error: err.message, code: err.code || "AUTOMATION_DENIED" });
      }
      await emitEvent("automation.run.requested", {
        actorId: req.user?.id,
        tenantId: req.user?.tenantId,
        source: "api",
      }, { module: "automation", actorUserId: req.user?.id, tenantId: req.user?.tenantId, source: "api" });
      next();
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/from-decision',
  requirePermission(['ai:decision:write', 'ai:crew:advisory']),
  executionIntentController.fromDecision
);

router.get(
  '/:intentId',
  requirePermission(['ai:read']),
  executionIntentController.get
);

router.get(
  '/',
  requirePermission(['ai:read']),
  executionIntentController.list
);

router.post(
  '/:intentId/approve',
  requirePermission(['ai:execution:approve']),
  executionIntentController.approve
);

router.post(
  '/:intentId/reject',
  requirePermission(['ai:execution:approve']),
  executionIntentController.reject
);

router.get(
  '/:intentId/handoff',
  requirePermission(['ai:execution:handoff']),
  executionIntentController.handoff
);

export default router;
