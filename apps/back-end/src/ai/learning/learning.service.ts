/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import { LearningSignal, PerformanceSnapshot, LearningInsight } from './learning.types.js';
import { collectLearningSignal } from './learning.collector.js';
import { analyzeSignals } from './learning.analyzer.js';
import { appendAudit, getAuditLog } from './learning.audit.js';

// Orchestrates collection + analysis, NO EXECUTION
export class LearningService {
  static collectSignal(signal: LearningSignal) {
    const collected = collectLearningSignal(signal);
    appendAudit({ type: 'signal', data: collected, timestamp: Date.now() });
    return collected;
  }

  static collectSnapshot(snapshot: PerformanceSnapshot) {
    appendAudit({ type: 'snapshot', data: { ...snapshot }, timestamp: Date.now() });
    return snapshot;
  }

  static analyze(): LearningInsight[] {
    const audit = getAuditLog();
    const signals = audit.filter((e) => e.type === 'signal').map((e) => e.data as LearningSignal);
    const snapshots = audit.filter((e) => e.type === 'snapshot').map((e) => e.data as PerformanceSnapshot);
    return analyzeSignals(signals, snapshots);
  }
}
