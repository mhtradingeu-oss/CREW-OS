// Consumer for ai.suggestion.approved events
import { subscribe } from '../event-bus.js';
import { executeApprovedSuggestion } from '../../automation/execution/automation-executor.js';
import { getSuggestionStatus } from '../../../modules/ai-suggestions/ai-suggestion.service.js';

/**
 * Handles ai.suggestion.approved events and triggers automation execution if not already processed.
 * @param {import('../event-bus').EventEnvelope<{suggestionId:string,correlationId?:string}>} event
 */
export function registerAiSuggestionApprovedConsumer() {
  subscribe<{ suggestionId: string }>('ai.suggestion.approved', async (event) => {
    const { suggestionId } = event.payload;
    // Check if already executed/failed
    const status = await getSuggestionStatus(suggestionId);
    if (status === 'executed' || status === 'failed') return;
    await executeApprovedSuggestion(suggestionId);
  });
}
