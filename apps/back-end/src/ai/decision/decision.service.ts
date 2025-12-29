/**
 * PHASE 7 LOCK:
 * Decision Authority ONLY.
 * Execution, automation, and side effects are FORBIDDEN here.
 * Any execution must occur in later phases.
 */
// Phase 7 — Decision Service (STRICT: NO EXECUTION, NO SIDE EFFECTS)
// Responsibilities: Validate, Gate, Audit, Return DecisionObject

import {
  DecisionObject,
  DecisionIntent,
  ALLOWED_DECISION_INTENTS,
  MAX_SUPPORTING_AGENTS,
} from './decision.types.js';
import { evaluateDecisionGate } from './decision.gates.js';
import { recordDecisionAudit } from './decision.audit.js';

interface ServiceResult {
  decision: DecisionObject;
  errors: string[];
}

/**
 * Accepts a DecisionObject, validates, gates, audits, returns finalized DecisionObject.
 * NO execution, NO events, NO DB, NO side effects outside memory.
 */
export function processDecision(decision: DecisionObject, primaryAgent: string, allAgents: string[]): ServiceResult {
  const errors: string[] = [];

  // Validate intent
  if (!ALLOWED_DECISION_INTENTS.includes(decision.intent)) {
    errors.push('Intent not allowed in Phase 7.');
  }

  // Validate primary agent (must be present and unique)
  const primaryCount = allAgents.filter(a => a === primaryAgent).length;
  if (primaryCount !== 1) {
    errors.push('Exactly one primary agent required per scope.');
  }
  if (decision.proposedBy !== primaryAgent) {
    errors.push('Decision must be proposed by the primary agent.');
  }

  // Validate supporting agents
  if (decision.supportingAgents.length > MAX_SUPPORTING_AGENTS) {
    errors.push('Supporting agents exceed maximum allowed.');
  }

  // Validate confidence
  if (decision.confidence < 0 || decision.confidence > 1) {
    errors.push('Confidence must be between 0 and 1.');
  }

  // Gate decision (risk → status)
  const status = evaluateDecisionGate(decision.riskLevel);
  const finalized: DecisionObject = {
    ...decision,
    status,
  };

  // Audit (in-memory only)
  recordDecisionAudit({
    decisionId: finalized.decisionId,
    scope: finalized.scope,
    intent: finalized.intent,
    status: finalized.status,
    timestamp: new Date().toISOString(),
  });

  return { decision: finalized, errors };
}
