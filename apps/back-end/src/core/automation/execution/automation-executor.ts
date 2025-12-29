

import { AISuggestionRepository } from '../../db/repositories/ai-suggestions.repository.js';
import { mapSuggestionToExecutionPlan } from './automation-plan-mapper.js';
import { runAutomationPlan } from '../engine/automation-engine.js';
import { emitEvent } from '../../events/event-bus.js';

type PlanRunner = typeof runAutomationPlan;
// Helpers for safe JSON parse and redaction
function safeParseJson(json: any) {
  if (!json || typeof json !== 'string') return undefined;
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function redactSecrets(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const SENSITIVE = ['secret', 'apiKey', 'token', 'password'];
  const redact = (val: any): any => {
    if (typeof val === 'string') {
      const parsed = safeParseJson(val);
      if (parsed !== undefined) {
        return redact(parsed);
      }
      return val;
    }
    if (Array.isArray(val)) return val.map(redact);
    if (val && typeof val === 'object') {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) =>
          SENSITIVE.includes(k.toLowerCase())
            ? [k, '[REDACTED]']
            : [k, redact(v)]
        )
      );
    }
    return val;
  };
  return redact(obj);
}


export async function executeApprovedSuggestion(
  suggestionId: string,
  actorUserId?: string,
  repo?: AISuggestionRepository,
  runPlan?: PlanRunner
) {
  const repository = repo || new AISuggestionRepository();
  const suggestion = await repository.getSuggestionById(suggestionId);
  if (!suggestion) return { status: 'not_found' };
  if (suggestion.status !== 'approved') return { status: 'not_approved' };
  if (suggestion.executedAt) return { status: 'already_executed' };

  const plan = mapSuggestionToExecutionPlan(suggestion);
  const correlationId = suggestion.correlationId || `exec-${suggestionId}-${Date.now()}`;
  const planRunner = runPlan ?? runAutomationPlan;
  let output, error;
  try {
    output = await planRunner(plan, { actorUserId, correlationId });
    await repository.markSuggestionExecuted(suggestionId, output);
    await emitEvent('ai.suggestion.executed', { suggestionId, actorUserId, output, correlationId });
    await repository.appendAuditLog({
      eventType: 'ai.suggestion.executed',
      suggestionId,
      actorUserId,
      correlationId,
      inputSnapshot: redactSecrets(safeParseJson(suggestion.inputSnapshotJson)),
      outputSnapshot: redactSecrets(output),
      timestamp: new Date().toISOString(),
    });
    return { status: 'executed', output };
  } catch (err: any) {
    error = err?.message || 'Unknown error';
    await repository.markSuggestionFailed(suggestionId, error);
    await emitEvent('ai.suggestion.failed', { suggestionId, actorUserId, error, correlationId });
    await repository.appendAuditLog({
      eventType: 'ai.suggestion.failed',
      suggestionId,
      actorUserId,
      correlationId,
      inputSnapshot: redactSecrets(safeParseJson(suggestion.inputSnapshotJson)),
      outputSnapshot: { error: redactSecrets(error) },
      timestamp: new Date().toISOString(),
    });
    return { status: 'failed', error };
  }
}
