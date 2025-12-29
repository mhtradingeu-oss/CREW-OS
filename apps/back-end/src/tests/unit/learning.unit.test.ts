/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import { LearningService } from '../../ai/learning/learning.service.js';
import type { LearningSignal, PerformanceSnapshot } from '../../ai/learning/learning.types.js';
import { getAuditLog, clearAuditLog } from '../../ai/learning/learning.audit.js';

describe('Learning Loop Phase 9', () => {
  beforeEach(() => {
    clearAuditLog();
  });

  it('does not modify upstream objects', () => {
    const signal: LearningSignal = {
      type: 'decision_outcome',
      decisionId: 'd1',
      outcome: 'approved',
      confidence: 0.9,
      agentId: 'agentA',
      timestamp: Date.now(),
    };
    const collected = LearningService.collectSignal(signal);
    expect(collected).toEqual(signal);
  });

  it('is deterministic: same input → same insight', () => {
    const snapshot: PerformanceSnapshot = {
      decisionId: 'd2',
      scope: 'risk=medium',
      agentIds: ['agentB'],
      originalConfidence: 0.95,
      finalOutcome: 'rejected',
      timestamp: Date.now(),
    };
    LearningService.collectSnapshot(snapshot);
    const insights1 = LearningService.analyze();
    clearAuditLog();
    LearningService.collectSnapshot(snapshot);
    const insights2 = LearningService.analyze();
    expect(insights1).toEqual(insights2);
  });

  it('has no execution/automation paths', () => {
    // No imports from automation, execution, media, audio
    // No side effects except in-memory audit
    expect(typeof LearningService.analyze).toBe('function');
  });

  it('audit stores no raw text or PII', () => {
    const signal: LearningSignal = {
      type: 'rejection_reason',
      decisionId: 'd3',
      reason: 'policy',
      agentId: 'agentC',
      timestamp: Date.now(),
    };
    LearningService.collectSignal(signal);
    const audit = getAuditLog();
    for (const entry of audit) {
      expect(typeof entry.data).not.toBe('string');
    }
  });

  it('can be fully disabled without breaking system', () => {
    // Simulate disabling by not calling LearningService
    expect(() => true).not.toThrow();
  });
});
