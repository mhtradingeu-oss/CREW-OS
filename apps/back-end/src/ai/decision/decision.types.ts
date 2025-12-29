// Phase 7 — Decision Authority Types (FOUNDATION ONLY)
// STRICT: No logic, no execution, no side effects

export type DecisionIntent =
  | 'ADVISE'           // Phase 6: Advisory only
  | 'DECIDE'           // Phase 7: Decision authority
  | 'REQUIRE_APPROVAL' // Phase 7: Requires explicit approval

export const ALLOWED_DECISION_INTENTS: DecisionIntent[] = [
  'DECIDE',
  'REQUIRE_APPROVAL',
];

export type DecisionRiskLevel = 'low' | 'medium' | 'high';

export type DecisionStatus =
  | 'PROPOSED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'BLOCKED';

export const MAX_SUPPORTING_AGENTS = 3;

export interface DecisionObject {
  decisionId: string; // uuid
  scope: string;
  intent: DecisionIntent;
  decision: string; // human-readable
  proposedBy: string; // Primary Agent name
  supportingAgents: string[]; // max 3
  confidence: number; // 0..1
  riskLevel: DecisionRiskLevel;
  requiresApproval: boolean;
  status: DecisionStatus;
  assumptions: string[];
  risks: string[];
  createdAt: string; // ISO string
}
