// Phase 7 — Decision Gates (PURE FUNCTIONS ONLY)
// STRICT: No side effects, no execution, no persistence

import { DecisionRiskLevel, DecisionStatus } from './decision.types.js';

/**
 * Evaluates the risk level and returns the appropriate DecisionStatus.
 * Rules:
 *   low    → PROPOSED
 *   medium → PENDING_APPROVAL
 *   high   → BLOCKED
 * No auto-approve, no execution, no side effects.
 */
export function evaluateDecisionGate(riskLevel: DecisionRiskLevel): DecisionStatus {
  if (riskLevel === 'low') return 'PROPOSED';
  if (riskLevel === 'medium') return 'PENDING_APPROVAL';
  if (riskLevel === 'high') return 'BLOCKED';
  // Defensive: fallback to BLOCKED for unknown risk
  return 'BLOCKED';
}
