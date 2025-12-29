export const AI_SUGGESTIONS_VERSION = "phase-13-ai-suggestions-layer";
export const AI_SUGGESTIONS_OUTPUT_TYPE = "ai-suggestions.advisory.v1";
export const AI_SUGGESTIONS_DECLARATION =
  "You are an advisory AI. Report observations, risks, or improvements without mutating state or instructing execution.";

const normalize = (term: string) => term.trim().replace(/\s+/g, " ").toLowerCase();
export const SUGGESTION_FORBIDDEN_TERMS = [
  "execute",
  "run",
  "launch",
  "trigger",
  "deploy",
  "implement",
  "write",
  "create",
  "delete",
  "schedule job",
  "command",
  "script",
  "perform",
  "act on",
  "do it",
  "do x",
  "please",
].map(normalize);

export const MAX_SUGGESTION_COUNT = 3;
export const MAX_RISK_FLAGS = 3;
export const MAX_IMPROVEMENT_IDEAS = 3;
