/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import { LearningSignal, PerformanceSnapshot } from './learning.types.js';

// In-memory, append-only, no PII, TTL allowed
interface AuditEntry {
  type: 'signal' | 'snapshot';
  data: LearningSignal | PerformanceSnapshot;
  timestamp: number;
}

const AUDIT_TTL_MS = 1000 * 60 * 60; // 1 hour
const auditLog: AuditEntry[] = [];

export function appendAudit(entry: AuditEntry) {
  // No raw text, no PII, append-only
  auditLog.push({ ...entry, timestamp: Date.now() });
}

export function getAuditLog(): AuditEntry[] {
  // Prune expired
  const now = Date.now();
  return auditLog.filter((e) => now - e.timestamp < AUDIT_TTL_MS);
}

export function clearAuditLog() {
  auditLog.length = 0;
}
