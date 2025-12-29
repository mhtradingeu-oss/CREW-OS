// Phase 7 — Decision Audit (IN-MEMORY ONLY)
// STRICT: No persistence, no PII, no side effects

import { DecisionStatus, DecisionIntent } from './decision.types.js';

export interface DecisionAuditEntry {
  decisionId: string;
  scope: string;
  intent: DecisionIntent;
  status: DecisionStatus;
  timestamp: string; // ISO string
}

const auditLog: DecisionAuditEntry[] = [];

/**
 * Records a decision audit entry in memory.
 * No persistence, no PII, no side effects.
 */
export function recordDecisionAudit(entry: DecisionAuditEntry): void {
  auditLog.push(entry);
}

/**
 * Returns a copy of the audit log (read-only).
 */
export function getDecisionAuditLog(): DecisionAuditEntry[] {
  return [...auditLog];
}
