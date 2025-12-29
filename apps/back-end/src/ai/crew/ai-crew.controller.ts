// AI Crew Advisory Controller
// POST /api/ai/crew/advisory

import { Router, Request, Response } from 'express';
import { AICrewService } from './ai-crew.service.js';
import { getDbGateway } from '../../bootstrap/db.js';
import { AdvisoryRequestSchema } from './ai-crew.types.js';
import { authenticateRequest } from '../../core/security/auth-middleware.js';
import { requirePermission } from '../../core/security/rbac.js';

const aiCrewService = new AICrewService(getDbGateway());

export class AICrewController {
  static async advisory(req: Request, res: Response) {
    const parse = AdvisoryRequestSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: parse.error.errors,
      });
    }

    const { scopes, agentNames, question, contextRefs } = parse.data;

    // User info injected by auth middleware
    // @ts-expect-error Express Request is extended by authentication middleware (Phase C wiring)
    const user = req.user as { id: string; role: string } | undefined;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const result = await aiCrewService.runAdvisory({
        scopes,
        agentNames,
        question,
        contextRefs,
        requestedBy: {
          userId: user.id,
          role: user.role,
        },
      });

      return res.json(result);
    } catch (err) {
      return res.status(500).json({
        error: 'Internal error',
        details: (err as Error).message,
      });
    }
  }
}

// Express router
export const aiCrewControllerRouter = Router();

aiCrewControllerRouter.post(
  '/advisory',
  authenticateRequest,
  requirePermission('ai:crew:advisory'),
  AICrewController.advisory
);
