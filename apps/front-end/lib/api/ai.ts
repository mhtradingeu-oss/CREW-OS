// Contract-required stubs for frontend contract alignment
export async function getAiStatus() {
  return null;
}

export async function listAiInsights() {
  return [];
}

// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.

export type AIJournalEntryType = "INSIGHT" | "LEARNING" | "DECISION";

export interface AIJournalEntry {
  id: string;
  title: string;
  summary: string;
  type: AIJournalEntryType;
  createdAt: string;
  tags?: string[];
}

// All functions intentionally omitted for V1 read-only stub.
