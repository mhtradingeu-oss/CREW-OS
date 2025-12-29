/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */
import { Router } from 'express';
import { authenticateRequest } from '../../core/security/auth-middleware.js';
import { requirePermission } from '../../core/security/rbac.js';
import { LearningService } from './learning.service.js';

const router = Router();

// GET /api/v1/ai/learning/insights (RBAC: ai:read)
router.get(
  '/insights',
  authenticateRequest,
  requirePermission('ai:read'),
  (req, res) => {
    const insights = LearningService.analyze();
    res.json({ insights });
  }
);

export default router;
