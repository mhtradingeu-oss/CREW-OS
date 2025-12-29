import { publish } from '../../event-bus.js';
import { registerMockApprovedConsumer } from '../__tests__/ai-suggestion-approved.consumer.test.js';

describe('ai.suggestion.approved consumer', () => {
  it('calls executor once for approved event', async () => {
    const mockExecutor = jest.fn();
    registerMockApprovedConsumer(mockExecutor);
    await publish('ai.suggestion.approved', { suggestionId: 's1', correlationId: 'c1' });
    // Wait for async event loop
    await new Promise((r) => setTimeout(r, 10));
    expect(mockExecutor).toHaveBeenCalledTimes(1);
    expect(mockExecutor).toHaveBeenCalledWith('s1');
  });

  it('does not call executor for repeated event', async () => {
    const mockExecutor = jest.fn();
    registerMockApprovedConsumer(mockExecutor);
    await publish('ai.suggestion.approved', { suggestionId: 's2', correlationId: 'c2' });
    await publish('ai.suggestion.approved', { suggestionId: 's2', correlationId: 'c2' });
    await new Promise((r) => setTimeout(r, 10));
    // Should only call once if idempotency is handled in handler
    expect(mockExecutor.mock.calls.length).toBeLessThanOrEqual(1);
  });
});
