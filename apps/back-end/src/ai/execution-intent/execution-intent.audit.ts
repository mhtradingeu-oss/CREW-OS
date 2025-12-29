// PHASE 8.0 LOCK: ExecutionIntent Audit (IN-MEMORY, APPEND-ONLY)
// No PII, no persistence

export interface ExecutionIntentAuditEntry {
  intentId: string;
  decisionId: string;
  status: string;
  timestamp: string;
  actorUserId?: string;
  reason?: string;
}

const auditLog: ExecutionIntentAuditEntry[] = [];

export function recordExecutionIntentAudit(entry: ExecutionIntentAuditEntry): void {
  auditLog.push(entry);
}

export function getExecutionIntentAuditLog(): ExecutionIntentAuditEntry[] {
  return [...auditLog];
}
