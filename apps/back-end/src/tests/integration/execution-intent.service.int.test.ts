import { jest } from '@jest/globals';
import { DecisionObject } from '../../ai/decision/decision.types.js';
import {
  createExecutionIntentFromDecision,
  approveExecutionIntent,
  rejectExecutionIntent,
  getHandoffPayload,
} from '../../ai/execution-intent/execution-intent.service.js';

jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid',
}));

describe('ExecutionIntent Service', () => {
  const baseDecision: Omit<DecisionObject, 'decisionId' | 'createdAt' | 'status'> = {
    scope: 'pricing',
    intent: 'REQUIRE_APPROVAL',
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
      status: 'PENDING_APPROVAL',
      ...overrides,
    };
  }

  it('blocks intent if decision is blocked', () => {
    const d = makeDecision({ status: 'BLOCKED' });
    const intent = createExecutionIntentFromDecision(d, { userId: 'u1', role: 'admin' });
    expect(intent.safety.blocked).toBe(true);
    expect(intent.safety.reasons.length).toBeGreaterThan(0);
  });

  it('always sets constraints.* disabled = true', () => {
    const d = makeDecision();
    const intent = createExecutionIntentFromDecision(d, { userId: 'u1', role: 'admin' });
    expect(intent.constraints.executionDisabled).toBe(true);
    expect(intent.constraints.automationDisabled).toBe(true);
    expect(intent.constraints.mediaDisabled).toBe(true);
    expect(intent.constraints.audioDisabled).toBe(true);
  });

  it('intent starts PENDING and cannot handoff', () => {
    const d = makeDecision();
    const intent = createExecutionIntentFromDecision(d, { userId: 'u1', role: 'admin' });
    expect(intent.approval.status).toBe('PENDING');
    expect(getHandoffPayload(intent.intentId)).toBeUndefined();
  });

  it('approve transitions to APPROVED; handoff works', () => {
    const d = makeDecision();
    const intent = createExecutionIntentFromDecision(d, { userId: 'u1', role: 'admin' });
    approveExecutionIntent(intent.intentId, 'approver', 'ok');
    const updated = getHandoffPayload(intent.intentId);
    expect(updated).toBeDefined();
    expect(updated?.status).toBe('APPROVED');
    expect(updated?.banner).toContain('PHASE 8.0: Execution disabled');
  });

  it('reject transitions to REJECTED; handoff fails', () => {
    const d = makeDecision();
    const intent = createExecutionIntentFromDecision(d, { userId: 'u1', role: 'admin' });
    rejectExecutionIntent(intent.intentId, 'approver', 'no');
    expect(getHandoffPayload(intent.intentId)).toBeUndefined();
  });

  it('deterministic plan normalization', () => {
    const d1 = makeDecision();
    const d2 = makeDecision();
    d2.decision = d1.decision;
    const i1 = createExecutionIntentFromDecision(d1, { userId: 'u1', role: 'admin' });
    const i2 = createExecutionIntentFromDecision(d2, { userId: 'u1', role: 'admin' });
    expect(i1.plan.summary).toBe(i2.plan.summary);
    expect(i1.plan.steps).toEqual(i2.plan.steps);
  });
});
