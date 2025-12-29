// PHASE 8.0 LOCK: ExecutionIntent Controller (NO EXECUTION, NO DB)
import { z } from 'zod';
import { Request, Response } from 'express';
import { DecisionIntent, DecisionStatus } from '../decision/decision.types.js';
import { createExecutionIntentFromDecision, approveExecutionIntent, rejectExecutionIntent, getHandoffPayload, getExecutionIntent, listExecutionIntents } from './execution-intent.service.js';

const fromDecisionSchema = z.object({
  decision: z.object({
    decisionId: z.string(),
    scope: z.string(),
    intent: z.enum(['ADVISE', 'DECIDE', 'REQUIRE_APPROVAL']),
    decision: z.string(),
    proposedBy: z.string(),
    supportingAgents: z.array(z.string()),
    confidence: z.number(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    requiresApproval: z.boolean(),
    status: z.enum(['PROPOSED', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'BLOCKED']),
    assumptions: z.array(z.string()),
    risks: z.array(z.string()),
    createdAt: z.string(),
  }),
  requestedBy: z.object({
    userId: z.string(),
    role: z.string(),
  })
});

// Extend Express Request type for user
type UserRequest = Request & { user: { userId: string; role: string } };

export const executionIntentController = {
  fromDecision: (req: Request, res: Response) => {
    const parsed = fromDecisionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors });
    const { decision, requestedBy } = parsed.data;
    // Cast types to match DecisionObject
    const typedDecision = {
      ...decision,
      intent: decision.intent as DecisionIntent,
      riskLevel: decision.riskLevel as 'low' | 'medium' | 'high',
      status: decision.status as DecisionStatus,
    };
    const intent = createExecutionIntentFromDecision(typedDecision, requestedBy);
    res.status(201).json(intent);
  },
  get: (req: Request, res: Response) => {
    const intentId = req.params.intentId as string;
    const intent = getExecutionIntent(intentId);
    if (!intent) return res.status(404).json({ error: 'Not found' });
    res.json(intent);
  },
  list: (req: Request, res: Response) => {
    const { scope, status } = req.query;
    const intents = listExecutionIntents({ scope: scope as string, status: status as string });
    res.json(intents);
  },
  approve: (req: Request, res: Response) => {
    const { reason } = req.body;
    const intentId = req.params.intentId as string;
    const user = (req as any).user as { userId: string; role: string };
    const intent = approveExecutionIntent(intentId, user.userId, reason);
    if (!intent) return res.status(400).json({ error: 'Cannot approve' });
    res.json(intent);
  },
  reject: (req: Request, res: Response) => {
    const { reason } = req.body;
    const intentId = req.params.intentId as string;
    const user = (req as any).user as { userId: string; role: string };
    const intent = rejectExecutionIntent(intentId, user.userId, reason);
    if (!intent) return res.status(400).json({ error: 'Cannot reject' });
    res.json(intent);
  },
  handoff: (req: Request, res: Response) => {
    const intentId = req.params.intentId as string;
    const payload = getHandoffPayload(intentId);
    if (!payload) return res.status(400).json({ error: 'Not approved or not found' });
    res.json(payload);
  },
};
