// PHASE 8.0 LOCK: ExecutionIntent Service (NO EXECUTION, NO DB, NO SIDE EFFECTS)
import { v4 as uuidv4 } from 'uuid';
import { DecisionObject } from '../decision/decision.types.js';
import {
  ExecutionIntent,
  ExecutionIntentStatus,
  HandoffPayload,
} from './execution-intent.types.js';
import { getExecutionIntentRiskLevel, requiresApproval, isBlocked } from './execution-intent.gates.js';
import { saveExecutionIntent, getExecutionIntent, listExecutionIntents, updateExecutionIntent } from './execution-intent.store.js';
import { recordExecutionIntentAudit } from './execution-intent.audit.js';
import { LearningService } from '../learning/learning.service.js';

// PHASE 8.0 LOCK: All constraints.* must be true, no execution allowed
const CONSTRAINTS = {
  executionDisabled: true,
  automationDisabled: true,
  mediaDisabled: true,
  audioDisabled: true,
} as const;

export function createExecutionIntentFromDecision(decision: DecisionObject, requestedBy: { userId: string; role: string }, missing: string[] = []): ExecutionIntent {
  const riskLevel = getExecutionIntentRiskLevel(decision);
  const approvalRequired = requiresApproval(riskLevel);
  const { blocked, reasons } = isBlocked(decision, missing);
  const now = new Date().toISOString();
  const intent: ExecutionIntent = {
    intentId: uuidv4(),
    decisionId: decision.decisionId,
    scope: decision.scope,
    createdAt: now,
    createdBy: requestedBy.userId,
    requestedByRole: requestedBy.role,
    riskLevel,
    requiresApproval: approvalRequired,
    approval: {
      status: 'PENDING',
    },
    plan: normalizePlan(decision),
    constraints: { ...CONSTRAINTS },
    safety: {
      blocked,
      reasons,
      policyRefs: [],
    },
  };
  saveExecutionIntent(intent);
  recordExecutionIntentAudit({
    intentId: intent.intentId,
    decisionId: intent.decisionId,
    status: intent.approval.status,
    timestamp: now,
    actorUserId: requestedBy.userId,
  });
  // PHASE 9: Learning Loop (read-only, in-memory)
  LearningService.collectSignal({
    type: 'decision_outcome',
    decisionId: intent.decisionId,
    outcome: 'approved',
    confidence: decision.confidence,
    agentId: decision.proposedBy,
    timestamp: Date.now(),
  });
  return intent;
}

export function approveExecutionIntent(intentId: string, userId: string, reason: string): ExecutionIntent | undefined {
  const intent = getExecutionIntent(intentId);
  if (!intent || intent.safety.blocked || intent.approval.status !== 'PENDING') return undefined;
  updateExecutionIntent(intentId, {
    approval: {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      reason,
    },
  });
  recordExecutionIntentAudit({
    intentId,
    decisionId: intent.decisionId,
    status: 'APPROVED',
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    reason,
  });
  // PHASE 9: Learning Loop (read-only, in-memory)
  LearningService.collectSignal({
    type: 'decision_outcome',
    decisionId: intent.decisionId,
    outcome: 'approved',
    confidence: 1,
    agentId: intent.createdBy,
    timestamp: Date.now(),
  });
  return getExecutionIntent(intentId);
}

export function rejectExecutionIntent(intentId: string, userId: string, reason: string): ExecutionIntent | undefined {
  const intent = getExecutionIntent(intentId);
  if (!intent || intent.safety.blocked || intent.approval.status !== 'PENDING') return undefined;
  updateExecutionIntent(intentId, {
    approval: {
      status: 'REJECTED',
      approvedBy: userId,
      approvedAt: new Date().toISOString(),
      reason,
    },
  });
  recordExecutionIntentAudit({
    intentId,
    decisionId: intent.decisionId,
    status: 'REJECTED',
    timestamp: new Date().toISOString(),
    actorUserId: userId,
    reason,
  });
  // PHASE 9: Learning Loop (read-only, in-memory)
  LearningService.collectSignal({
    type: 'decision_outcome',
    decisionId: intent.decisionId,
    outcome: 'rejected',
    confidence: 0,
    agentId: intent.createdBy,
    timestamp: Date.now(),
  });
  return getExecutionIntent(intentId);
}

export function getHandoffPayload(intentId: string): HandoffPayload | undefined {
  const intent = getExecutionIntent(intentId);
  if (!intent || intent.approval.status !== 'APPROVED') return undefined;
  return {
    intentId: intent.intentId,
    decisionId: intent.decisionId,
    status: intent.approval.status,
    plan: intent.plan,
    constraints: intent.constraints,
    banner: 'PHASE 8.0: Execution disabled. This payload is for future executor only.',
  };
}

function normalizePlan(decision: DecisionObject): ExecutionIntent['plan'] {
  // Deterministic plan normalization
  return {
    kind: 'OTHER',
    summary: decision.decision,
    steps: [decision.decision],
  };
}

export {
  getExecutionIntent,
  listExecutionIntents,
};
