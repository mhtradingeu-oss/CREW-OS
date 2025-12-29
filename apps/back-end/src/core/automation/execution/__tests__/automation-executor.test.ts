import { jest } from '@jest/globals';
import { AISuggestionRepository } from '../../../db/repositories/ai-suggestions.repository.js';

// ------------------------------------------------------------------
// Repo mock (typed + stable)
// ------------------------------------------------------------------
const repoMocks: jest.Mocked<AISuggestionRepository> = {
  getSuggestionById: jest.fn(),
  markSuggestionExecuted: jest.fn(),
  markSuggestionFailed: jest.fn(),
  appendAuditLog: jest.fn(),
} as any;

jest.unstable_mockModule(
  '../../../db/repositories/ai-suggestions.repository',
  () => ({
    AISuggestionRepository: jest.fn(() => repoMocks),
  })
);

// ------------------------------------------------------------------
// Automation engine mock
// ------------------------------------------------------------------
const createExecutionOutput = () => ({
  result: 'success',
  plan: {
    input: {
      foo: 'bar',
      secret: 'should-hide',
    },
  },
});

const runAutomationPlanMock = jest.fn(async () => createExecutionOutput());

// ------------------------------------------------------------------
// Plan mapper mock
// ------------------------------------------------------------------
const mapSuggestionToExecutionPlan = jest.fn(() => ({ plan: 'mocked' }));

jest.unstable_mockModule(
  '../automation-plan-mapper',
  () => ({
    mapSuggestionToExecutionPlan,
  })
);

// ------------------------------------------------------------------
// Event bus mock (must match real import name)
// ------------------------------------------------------------------
const publish = jest.fn();

jest.unstable_mockModule(
  '../../../events/event-bus',
  () => ({
    publish,
  })
);

// ------------------------------------------------------------------
// Import AFTER mocks
// ------------------------------------------------------------------
let executeApprovedSuggestion: (
  suggestionId: string,
  userId?: string,
  repo?: AISuggestionRepository,
  runner?: any
) => Promise<any>;

beforeAll(async () => {
  const mod = await import('../automation-executor.js');
  executeApprovedSuggestion = mod.executeApprovedSuggestion;
});

// ------------------------------------------------------------------
// Test data
// ------------------------------------------------------------------
const baseSuggestion = {
  id: 's1',
  status: 'approved',
  executedAt: null,
};

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe('executeApprovedSuggestion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    runAutomationPlanMock.mockResolvedValue(createExecutionOutput());
    mapSuggestionToExecutionPlan.mockReturnValue({ plan: 'mocked' });
  });

  it('returns not_found if suggestion missing', async () => {
    repoMocks.getSuggestionById.mockResolvedValue(undefined as any);
    const res = await executeApprovedSuggestion('bad', undefined, repoMocks, runAutomationPlanMock);
    expect(res.status).toBe('not_found');
  });

  it('returns not_approved if status not approved', async () => {
    repoMocks.getSuggestionById.mockResolvedValue({
      ...baseSuggestion,
      status: 'pending',
    } as any);

    const res = await executeApprovedSuggestion('s1', undefined, repoMocks, runAutomationPlanMock);
    expect(res.status).toBe('not_approved');
  });

  it('returns already_executed if already executed', async () => {
    repoMocks.getSuggestionById.mockResolvedValue({
      ...baseSuggestion,
      executedAt: '2024-01-01T00:00:00Z',
    } as any);

    const res = await executeApprovedSuggestion('s1', undefined, repoMocks, runAutomationPlanMock);
    expect(res.status).toBe('already_executed');
  });

  it('executes and logs audit with redacted snapshots', async () => {
    repoMocks.getSuggestionById.mockResolvedValue({
      ...baseSuggestion,
      inputSnapshotJson: '{"foo":"bar","secret":"should-hide"}',
    } as any);

    const res = await executeApprovedSuggestion('s1', 'u1', repoMocks, runAutomationPlanMock);

    expect(res.status).toBe('executed');
    expect(repoMocks.markSuggestionExecuted).toHaveBeenCalled();

    const audit = repoMocks.appendAuditLog.mock.calls.find(
      ([arg]) => arg.eventType === 'ai.suggestion.executed'
    )?.[0];

    expect(audit).toBeTruthy();
    expect(audit.inputSnapshot).toEqual({
      foo: 'bar',
      secret: '[REDACTED]',
    });
    expect(JSON.stringify(audit.outputSnapshot)).not.toMatch(/should-hide/);
  });

  it('marks failed and logs redacted audit on error', async () => {
    repoMocks.getSuggestionById.mockResolvedValue({
      ...baseSuggestion,
      inputSnapshotJson: '{"foo":"bar","token":"tok123"}',
    } as any);

    runAutomationPlanMock.mockRejectedValueOnce(new Error('fail'));

    const res = await executeApprovedSuggestion('s1', 'u1', repoMocks, runAutomationPlanMock);

    expect(res.status).toBe('failed');
    expect(repoMocks.markSuggestionFailed).toHaveBeenCalledWith('s1', 'fail');

    const audit = repoMocks.appendAuditLog.mock.calls.find(
      ([arg]) => arg.eventType === 'ai.suggestion.failed'
    )?.[0];

    expect(audit.inputSnapshot).toEqual({
      foo: 'bar',
      token: '[REDACTED]',
    });
    expect(JSON.stringify(audit.outputSnapshot)).not.toMatch(/tok123/);
  });
});
