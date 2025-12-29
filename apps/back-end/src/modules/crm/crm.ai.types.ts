export interface CrmScoreInput {
  leadName: string;
  intent?: string;
}

export interface CrmScoreResult {
  score: number;
  probability: number;
  reasons: string[];
  nextAction: string;
}
