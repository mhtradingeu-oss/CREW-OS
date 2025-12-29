import { z } from "zod";
import {
  AI_SUGGESTIONS_OUTPUT_TYPE,
  AI_SUGGESTIONS_VERSION,
  AI_SUGGESTIONS_DECLARATION,
  SUGGESTION_FORBIDDEN_TERMS,
  MAX_SUGGESTION_COUNT,
  MAX_RISK_FLAGS,
  MAX_IMPROVEMENT_IDEAS,
} from "./ai-suggestions.constants.js";
import type {
  AISuggestionEntry,
  AISuggestionRiskFlag,
  AISuggestionImprovementIdea,
  AISuggestionsPayload,
} from "./ai-suggestions.types.js";

const suggestionEntrySchema = z.object({
  id: z.string().min(1),
  type: z.enum(["optimization", "risk", "warning"]),
  confidence: z.number().min(0).max(1),
  rationale: z.string().min(1),
  evidence: z.array(z.string().min(1)).min(1).max(5),
  suggestedAction: z.string().min(1),
  approvalMetadata: z.object({
    requiredRole: z.string().min(1),
    approvalChannel: z.string().min(1),
  }),
  auditMetadata: z.object({
    snapshotHash: z.string().min(1),
    suggestionHash: z.string().min(1),
  }),
});

const riskFlagSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high"]),
  evidence: z.array(z.string().min(1)).max(4),
});

const improvementIdeaSchema = z.object({
  id: z.string().min(1),
  focus: z.string().min(1),
  detail: z.string().min(1),
});

const suggestionsSchema = z.object({
  version: z.literal(AI_SUGGESTIONS_VERSION),
  declaration: z.literal(AI_SUGGESTIONS_DECLARATION),
  generatedAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "generatedAt must be a valid ISO timestamp"),
  snapshotHash: z.string().min(1),
  suggestions: z.array(suggestionEntrySchema).min(1).max(MAX_SUGGESTION_COUNT),
  riskFlags: z.array(riskFlagSchema).max(MAX_RISK_FLAGS),
  improvementIdeas: z.array(improvementIdeaSchema).max(MAX_IMPROVEMENT_IDEAS),
  metadata: z.object({
    aiVersion: z.literal(AI_SUGGESTIONS_VERSION),
    outputType: z.literal(AI_SUGGESTIONS_OUTPUT_TYPE),
    inputSizeBytes: z.number().int().nonnegative(),
    durationMs: z.number().int().nonnegative(),
  }),
});

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsForbiddenTerm(text: string) {
  const normalized = text.toLowerCase();
  return SUGGESTION_FORBIDDEN_TERMS.some((term) => {
    if (term.includes(" ")) {
      return normalized.includes(term);
    }
    const regex = new RegExp(`\\b${escapeRegExp(term)}\\b`);
    return regex.test(normalized);
  });
}

function enforceAdvisoryLanguage(value: string | string[]) {
  const texts = Array.isArray(value) ? value : [value];
  texts.forEach((text) => {
    if (containsForbiddenTerm(text)) {
      throw new Error("Suggestions must stay advisory and avoid execution language.");
    }
  });
}

export function validateSuggestionsPayload(guess: unknown): AISuggestionsPayload {
  const parsed = suggestionsSchema.parse(guess);
  parsed.suggestions.forEach((suggestion) => {
    enforceAdvisoryLanguage(suggestion.rationale);
    enforceAdvisoryLanguage(suggestion.suggestedAction);
    enforceAdvisoryLanguage(suggestion.evidence);
  });
  parsed.riskFlags.forEach((risk) => {
    enforceAdvisoryLanguage(risk.description);
    enforceAdvisoryLanguage(risk.evidence);
  });
  parsed.improvementIdeas.forEach((idea) => {
    enforceAdvisoryLanguage(idea.focus);
    enforceAdvisoryLanguage(idea.detail);
  });
  return parsed;
}
