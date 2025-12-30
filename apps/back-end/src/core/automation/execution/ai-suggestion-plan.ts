import { z } from 'zod';

/**
 * @typedef {Object} AISuggestion
 * @property {string} suggestionId
 * @property {string} domain
 * @property {string} suggestionType
 * @property {any} proposedOutputJson
 */

/**
 * @typedef {Object} ExecutionStep
 * @property {string} name
 * @property {any} payload
 * @property {string} idempotencyKey
 * @property {any} [rollbackPayload]
 */

/**
 * @typedef {Object} ExecutionPlan
 * @property {string} correlationId
 * @property {string} suggestionId
 * @property {string} domain
 * @property {ExecutionStep[]} steps
 */

// Domain-specific schemas

const pricingOutputSchema = z.object({
  steps: z.array(z.object({
    name: z.string(),
    payload: z.any(),
    idempotencyKey: z.string(),
    rollbackPayload: z.any().optional(),
  })),
});

const inventoryOutputSchema = z.object({
  steps: z.array(z.object({
    name: z.string(),
    payload: z.any(),
    idempotencyKey: z.string(),
    rollbackPayload: z.any().optional(),
  })),
});


function getSchema(domain: string, suggestionType: string) {
  // Extend with more domain/suggestionType logic as needed
  if (domain === 'pricing') return pricingOutputSchema;
  if (domain === 'inventory') return inventoryOutputSchema;
  return null;
}



export function buildExecutionPlanFromSuggestion(s: {
  suggestionId: string;
  domain: string;
  suggestionType: string;
  proposedOutputJson: unknown;
}):
  | { correlationId: string; suggestionId: string; domain: string; steps: any[] }
  | { error: string; details?: unknown } {
  const schema = getSchema(s.domain, s.suggestionType);
  if (!schema) {
    return { error: `Unsupported domain: ${s.domain}` };
  }
  const result = schema.safeParse(s.proposedOutputJson);
  if (!result.success) {
    return {
      error: 'Invalid proposedOutputJson',
      details: result.error.errors,
    };
  }
  const steps = result.data.steps.map((step: any) => ({
    name: step.name,
    payload: step.payload,
    idempotencyKey: step.idempotencyKey,
    rollbackPayload: step.rollbackPayload,
  }));
  return {
    correlationId: s.suggestionId,
    suggestionId: s.suggestionId,
    domain: s.domain,
    steps,
  };
}


