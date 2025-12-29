// ai-crew.session.controller.ts
// Controller for advisory session composition endpoint

import { Request, Response } from 'express';
import { z } from 'zod';
import { AICrewSessionService } from './ai-crew.session.service.js';
import { authenticateRequest } from '../../core/security/auth-middleware.js';
import { requirePermission } from '../../core/security/rbac.js';
import { getDbGateway } from '../../bootstrap/db.js';
// Use generic Error for hygiene (ApiError.badRequest not available)

const questionSchema = z.object({
  scopes: z.array(z.string()).min(1).max(3),
  agentNames: z.array(z.string()).min(1).max(3).optional(),
  question: z.string().min(10).max(2000),
  contextRefs: z.array(z.string()).optional(),
});

const sessionInputSchema = z.object({
  sessionId: z.string().optional(),
  questions: z.array(questionSchema).min(1).max(10),
});

export const advisorySessionController = {
  postSession: [
    authenticateRequest,
    requirePermission(["ai:crew:advisory", "ai:read"]),
    async (req: Request, res: Response) => {
      const parse = sessionInputSchema.safeParse(req.body);
      if (!parse.success) {
        throw new Error('Invalid session input: ' + parse.error);
      }
      const { sessionId, questions } = parse.data;
      const requestedBy = {
        userId: (req as any).user?.id || 'unknown',
        role: (req as any).user?.role || 'unknown',
      };
      try {
        const result = await AICrewSessionService.runAdvisorySession(
          {
            sessionId,
            questions,
            requestedBy,
          },
          getDbGateway(),
        );
        res.json(result);
      } catch (err: any) {
        throw new Error(err.message || 'Session error');
      }
    },
  ],
};
