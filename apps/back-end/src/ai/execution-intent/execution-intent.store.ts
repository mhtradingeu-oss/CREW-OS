// PHASE 8.0 LOCK: In-memory ExecutionIntent Store (TTL)
// No persistence, no DB, no PII

import { ExecutionIntent } from './execution-intent.types.js';

const TTL_MS = 60 * 60 * 1000; // 60 minutes
const store = new Map<string, { intent: ExecutionIntent; expiresAt: number }>();

function now() { return Date.now(); }

export function saveExecutionIntent(intent: ExecutionIntent) {
  store.set(intent.intentId, { intent, expiresAt: now() + TTL_MS });
}

export function getExecutionIntent(intentId: string): ExecutionIntent | undefined {
  cleanupExpired();
  const entry = store.get(intentId);
  return entry ? entry.intent : undefined;
}

export function listExecutionIntents(filter: { scope?: string; status?: string } = {}): ExecutionIntent[] {
  cleanupExpired();
  return Array.from(store.values())
    .map(e => e.intent)
    .filter(i => (!filter.scope || i.scope === filter.scope) && (!filter.status || i.approval.status === filter.status));
}

export function updateExecutionIntent(intentId: string, update: Partial<ExecutionIntent>) {
  const entry = store.get(intentId);
  if (!entry) return;
  store.set(intentId, { intent: { ...entry.intent, ...update }, expiresAt: entry.expiresAt });
}

export function deleteExecutionIntent(intentId: string) {
  store.delete(intentId);
}

function cleanupExpired() {
  const nowMs = now();
  for (const [id, entry] of store.entries()) {
    if (entry.expiresAt < nowMs) store.delete(id);
  }
}
