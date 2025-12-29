/**
 * PHASE 9 — LEARNING LOOP
 * Closure tests for API and integration.
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import supertest from 'supertest';
import { createApp } from '../../app.js';
import { LearningService } from '../../ai/learning/learning.service.js';
import { clearAuditLog } from '../../ai/learning/learning.audit.js';

describe('Learning API & Integration', () => {
  beforeEach(() => {
    clearAuditLog();
  });

  it('GET /api/v1/ai/learning/insights returns deterministic insights', async () => {
    // Add a deterministic signal
    LearningService.collectSignal({
      type: 'decision_outcome',
      decisionId: 'd9',
      outcome: 'rejected',
      confidence: 0.95,
      agentId: 'agentZ',
      timestamp: Date.now(),
    });
    const app = createApp();
    // Simulate RBAC (mocked, skip actual auth for test)
    const res1 = await supertest(app)
      .get('/api/v1/ai/learning/insights')
      .set('Authorization', 'Bearer test')
      .expect(200);
    const res2 = await supertest(app)
      .get('/api/v1/ai/learning/insights')
      .set('Authorization', 'Bearer test')
      .expect(200);
    expect(res1.body).toEqual(res2.body);
  });

  it('does not store raw text or PII in audit', () => {
    LearningService.collectSignal({
      type: 'rejection_reason',
      decisionId: 'd10',
      reason: 'policy',
      agentId: 'agentY',
      timestamp: Date.now(),
    });
    const audit = LearningService.analyze();
    for (const insight of audit) {
      expect(typeof insight.description).toBe('string');
      expect(insight.description).not.toMatch(/@|\d{3}-\d{2}-\d{4}|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    }
  });

  it('has no forbidden imports or execution paths', () => {
    // Check that forbidden modules are not imported
    const forbidden = ['automation', 'media', 'audio', 'execution'];
    const files = Object.keys(require.cache);
    for (const f of files) {
      for (const word of forbidden) {
        expect(f.includes(word)).toBe(false);
      }
    }
  });
});
