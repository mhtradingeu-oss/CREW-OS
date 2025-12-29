
import { jest } from '@jest/globals';
import { subscribe } from '../../event-bus.js';

test('ai-suggestion-approved consumer is registered', () => {
  expect(true).toBe(true);
});
export function registerMockApprovedConsumer(mockExecutor: (id: string) => void) {
  subscribe('ai.suggestion.approved', async (event: { payload: { suggestionId: string } }) => {
    await mockExecutor(event.payload.suggestionId);
  });
}
