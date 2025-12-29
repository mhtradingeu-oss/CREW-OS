import type { AIReadOnlySnapshot } from "../ai-read-only/ai-read-only.types.js";

export type AISuggestionType = "optimization" | "risk" | "warning";

export type AISuggestionEntry = Readonly<{
  id: string;
  type: AISuggestionType;
  confidence: number;
  rationale: string;
  evidence: string[];
  suggestedAction: string;
  approvalMetadata: {
    requiredRole: string;
    approvalChannel: string;
  };
  auditMetadata: {
    snapshotHash: string;
    suggestionHash: string;
  };
}>;

export type AISuggestionRiskFlag = Readonly<{
  id: string;
  description: string;
  severity: "low" | "medium" | "high";
  evidence: string[];
}>;

export type AISuggestionImprovementIdea = Readonly<{
  id: string;
  focus: string;
  detail: string;
}>;

export type AISuggestionsPayload = Readonly<{
  version: string;
  declaration: string;
  generatedAt: string;
  snapshotHash: string;
  suggestions: AISuggestionEntry[];
  riskFlags: AISuggestionRiskFlag[];
  improvementIdeas: AISuggestionImprovementIdea[];
  metadata: {
    aiVersion: string;
    outputType: string;
    inputSizeBytes: number;
    durationMs: number;
  };
}>;

export type AISuggestionsReadout = Readonly<{
  payload: AISuggestionsPayload;
  snapshot: AIReadOnlySnapshot;
}>;
