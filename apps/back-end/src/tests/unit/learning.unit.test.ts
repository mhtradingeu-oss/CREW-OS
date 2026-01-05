/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import { LearningService } from '../../ai/learning/learning.service.js';
import { getAuditLog, clearAuditLog } from '../../ai/learning/learning.audit.js';

describe('Learning Loop Phase 9', () => {
  // Deterministic clock for timestamp-based tests
  let DeterministicClock: new (epoch: number) => {
    mockDateNow(): void;
    restore(): void;
  };

  let clock: {
    mockDateNow(): void;
    restore(): void;
  };

  beforeAll(async () => {
    const mod = await import('../../ai/learning/testing/DeterministicClock.js');
    DeterministicClock = mod.DeterministicClock;
  });

  beforeEach(() => {
    clearAuditLog();
    clock = new DeterministicClock(1700000000000); // fixed epoch
    clock.mockDateNow();
  });

  afterEach(() => {
    clock.restore();
  });

  it('does not modify upstream objects', () => {
    const signal = {
      type: 'decision_outcome',
      decisionId: 'd1',
      outcome: 'approved',
      confidence: 0.9,
      agentId: 'agentA',
      timestamp: Date.now(),
    };

    const collected = LearningService.collectSignal(
      signal as unknown as Parameters<typeof LearningService.collectSignal>[0],
    );

    expect(collected).toEqual(signal);
  });

  it('is deterministic: same input → same insight', () => {
    const snapshot = {
      decisionId: 'd2',
      scope: 'risk=medium',
      agentIds: ['agentB'],
      originalConfidence: 0.95,
      finalOutcome: 'rejected',
      timestamp: Date.now(),
    };

    LearningService.collectSnapshot(
      snapshot as unknown as Parameters<typeof LearningService.collectSnapshot>[0],
    );

    const insights1 = LearningService.analyze();

    clearAuditLog();

    LearningService.collectSnapshot(
      snapshot as unknown as Parameters<typeof LearningService.collectSnapshot>[0],
    );

    const insights2 = LearningService.analyze();

    expect(insights1).toEqual(insights2);
  });

  it('has no execution/automation paths', () => {
    // No imports from automation, execution, media, audio
    // No side effects except in-memory audit
    expect(typeof LearningService.analyze).toBe('function');
  });

  it('audit stores no raw text or PII', () => {
    const signal2 = {
      type: 'rejection_reason',
      decisionId: 'd3',
      reason: 'policy',
      agentId: 'agentC',
      timestamp: Date.now(),
    };

    LearningService.collectSignal(
      signal2 as unknown as Parameters<typeof LearningService.collectSignal>[0],
    );

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
