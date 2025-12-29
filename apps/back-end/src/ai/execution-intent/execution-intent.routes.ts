// PHASE 8.0 LOCK: ExecutionIntent Routes (NO EXECUTION, NO DB)
import { Router } from 'express';
import { executionIntentController } from './execution-intent.controller.js';
import { authenticateRequest } from '../../core/security/auth-middleware.js';
import { requirePermission } from '../../core/security/rbac.js';

const router = Router();

router.use(authenticateRequest);

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
