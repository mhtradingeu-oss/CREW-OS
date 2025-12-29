// ai-crew.session.types.ts
// Types for Advisory Session Composition (v2)

// Local type for advisory result (avoid broken ESM import)
export type RunAdvisoryResult = any;

export interface AdvisorySessionQuestionInput {
  scopes: string[]; // 1..3
  agentNames?: string[]; // 1..3
  question: string; // 10..2000 chars
  contextRefs?: string[];
}

export interface AdvisorySessionInput {
  sessionId?: string;
  questions: AdvisorySessionQuestionInput[]; // 1..10
  requestedBy: { userId: string; role: string };
}

export interface AdvisorySessionPerQuestionResult {
  index: number;
  question: string;
  result: RunAdvisoryResult;
}

export interface AdvisorySessionConflict {
  topic: string;
  agents: string[];
  notes: string;
}

export interface AdvisorySessionExplainability {
  compositionRationale: string;
  questionsProcessed: number;
  agentsUsedUnion: string[];
  contextsUsedUnion: string[];
  assumptionsUnion: string[];
  risksUnion: string[];
}

export interface AdvisorySessionOutput {
  sessionId: string;
  sessionSummary: string;
  perQuestion: AdvisorySessionPerQuestionResult[];
  crossInsights: string[];
  conflicts: AdvisorySessionConflict[];
  confidence: number;
  explainability: AdvisorySessionExplainability;
}

// In-memory session store types
export interface AdvisorySessionMemoryRecord {
  sessionId: string;
  createdAt: number;
  questionHashes: Array<{ hash: string; length: number }>;
  agentsUsed: string[];
  confidence: number;
  summary: string;
}

export type AdvisorySessionMemoryStore = Map<string, AdvisorySessionMemoryRecord>;

// Helper for session store TTL
export const ADVISORY_SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes
