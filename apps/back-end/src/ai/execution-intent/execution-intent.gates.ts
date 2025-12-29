// PHASE 8.0 LOCK: ExecutionIntent Gates (PURE, DETERMINISTIC)
// No execution, no side effects

import { DecisionObject } from '../decision/decision.types.js';
import { ExecutionIntentRiskLevel, STRICT_APPROVAL_MODE } from './execution-intent.types.js';

export function getExecutionIntentRiskLevel(decision: DecisionObject): ExecutionIntentRiskLevel {
  if (decision.riskLevel === 'high') return 'HIGH';
  if (decision.riskLevel === 'medium') return 'MEDIUM';
  return 'LOW';
}

export function requiresApproval(risk: ExecutionIntentRiskLevel): boolean {
  if (STRICT_APPROVAL_MODE) return true;
  return risk !== 'LOW';
}

export function isBlocked(decision: DecisionObject, missing: string[]): { blocked: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (decision.status === 'BLOCKED') reasons.push('Decision is blocked by risk gates.');
  if (!decision.proposedBy) reasons.push('Missing primary agent.');
  if (missing.length > 0) reasons.push(...missing);
  return { blocked: reasons.length > 0, reasons };
}
