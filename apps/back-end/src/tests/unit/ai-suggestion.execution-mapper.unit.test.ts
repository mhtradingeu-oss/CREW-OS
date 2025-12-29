import { jest } from '@jest/globals';
import { buildExecutionPlanFromSuggestion } from '../../modules/ai-suggestions/ai-suggestion.execution-mapper.js';

describe('buildExecutionPlanFromSuggestion', () => {
  it('maps valid pricing suggestion to execution plan', () => {
    const suggestion = {
      suggestionId: 's1',
      domain: 'pricing',
      suggestionType: 'update-pricing',
      proposedOutputJson: {
        steps: [
          {
            name: 'updatePrice',
            payload: { productId: 'p1', newPrice: 100 },
            idempotencyKey: 'key1',
          },
        ],
      },
    };
    const plan = buildExecutionPlanFromSuggestion(suggestion);
    expect(plan).toMatchObject({
      correlationId: 's1',
      suggestionId: 's1',
      domain: 'pricing',
      steps: [
        {
          name: 'updatePrice',
          payload: { productId: 'p1', newPrice: 100 },
          idempotencyKey: 'key1',
        },
      ],
    });
  });

  it('returns error for invalid JSON', () => {
    const suggestion = {
      suggestionId: 's2',
      domain: 'pricing',
      suggestionType: 'update-pricing',
      proposedOutputJson: {
        // missing steps
      },
    };
    const result = buildExecutionPlanFromSuggestion(suggestion);
    expect(result).toHaveProperty('error', 'Invalid proposedOutputJson');
    expect(result).toHaveProperty('details');
  });

  it('returns error for missing required fields in step', () => {
    const suggestion = {
      suggestionId: 's3',
      domain: 'inventory',
      suggestionType: 'update-inventory',
      proposedOutputJson: {
        steps: [
          {
            // missing name and idempotencyKey
            payload: { itemId: 'i1', quantity: 10 },
          },
        ],
      },
    };
    const result = buildExecutionPlanFromSuggestion(suggestion);
    expect(result).toHaveProperty('error', 'Invalid proposedOutputJson');
    expect(result).toHaveProperty('details');
  });

  it('returns error for unsupported domain', () => {
    const suggestion = {
      suggestionId: 's4',
      domain: 'unknown',
      suggestionType: 'foo',
      proposedOutputJson: {},
    };
    const result = buildExecutionPlanFromSuggestion(suggestion);
    expect(result).toHaveProperty('error', 'Unsupported domain: unknown');
  });
});
