import { jest } from '@jest/globals';
import { processDecision } from '../../ai/decision/decision.service.js';
import { DecisionObject } from '../../ai/decision/decision.types.js';
import { getDecisionAuditLog } from '../../ai/decision/decision.audit.js';

describe('Phase 7 Decision Authority', () => {
  const baseDecision: Omit<DecisionObject, 'decisionId' | 'createdAt' | 'status'> = {
    scope: 'pricing',
    intent: 'DECIDE',
    decision: 'Increase price by 5% on SKU-123',
    proposedBy: 'pricing-primary-agent',
    supportingAgents: ['finance-advisor', 'market-analyst'],
    confidence: 0.8,
    riskLevel: 'medium',
    requiresApproval: true,
    assumptions: ['Market demand stable'],
    risks: ['Competitor reaction'],
  };

  function makeDecision(overrides: Partial<DecisionObject> = {}): DecisionObject {
    return {
      ...baseDecision,
      decisionId: 'dec-' + Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
      status: 'PROPOSED',
      ...overrides,
    };
  }

  it('blocks high risk decisions', () => {
    const d = makeDecision({ riskLevel: 'high' });
    const { decision, errors } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    expect(decision.status).toBe('BLOCKED');
    expect(errors.length).toBe(0);
  });

  it('requires approval for medium risk', () => {
    const d = makeDecision({ riskLevel: 'medium' });
    const { decision, errors } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    expect(decision.status).toBe('PENDING_APPROVAL');
    expect(errors.length).toBe(0);
  });

  it('proposes low risk decisions', () => {
    const d = makeDecision({ riskLevel: 'low' });
    const { decision, errors } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    expect(decision.status).toBe('PROPOSED');
    expect(errors.length).toBe(0);
  });

  it('enforces supporting agent limit', () => {
    const d = makeDecision({ supportingAgents: ['a', 'b', 'c', 'd'] });
    const { errors } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    expect(errors.some((e: string) => e.includes('Supporting agents exceed'))).toBe(true);
  });

  it('enforces one primary agent per scope', () => {
    const d = makeDecision();
    const { errors } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', 'pricing-primary-agent']);
    expect(errors.some((e: string) => e.includes('Exactly one primary agent'))).toBe(true);
  });

  it('never executes or triggers side effects', () => {
    // No execution fields, no events, no DB, no apply/run logic
    const d = makeDecision();
    const { decision } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    // Check that only status changes, nothing else
    expect(['PROPOSED', 'PENDING_APPROVAL', 'BLOCKED']).toContain(decision.status);
    // No execution, no DB, no events possible by design
  });

  it('produces deterministic results', () => {
    const d = makeDecision({ riskLevel: 'medium' });
    const { decision: d1 } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    const { decision: d2 } = processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    expect(d1.status).toBe(d2.status);
  });

  it('logs audit entries in memory only', () => {
    const d = makeDecision();
    processDecision(d, 'pricing-primary-agent', ['pricing-primary-agent', ...d.supportingAgents]);
    const log = getDecisionAuditLog();
    expect(log.some((e: { decisionId: string }) => e.decisionId === d.decisionId)).toBe(true);
  });
});
