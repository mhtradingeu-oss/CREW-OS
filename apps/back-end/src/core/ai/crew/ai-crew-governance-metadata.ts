// AI Crew Governance Metadata Attachment
// PHASE 3.0 — AI Governance & Safety Layer (Read-Only)

import { getAIGovernancePolicy, isProposalAllowed, PlanScope, InsightType, AICrewRole } from '../governance/ai-governance-policy.js';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface GovernanceMetadata {
  policy: {
    crewRole: AICrewRole;
    allowed: boolean;
    policyDescription?: string;
  };
  confidenceScore: number; // 0–1
  riskLevel: RiskLevel;
}

// Simple confidence scoring (stub: replace with real logic as needed)
export function computeConfidenceScore(insight: any): number {
  // Example: use a field or fallback
  if (typeof insight.confidence === 'number') return Math.max(0, Math.min(1, insight.confidence));
  return 0.7; // default stub
}

// Simple risk scoring (stub: replace with real logic as needed)
export function computeRiskLevel(insight: any): RiskLevel {
  // Example: use a field or fallback
  if (insight.risk === 'high') return 'HIGH';
  if (insight.risk === 'medium') return 'MEDIUM';
  if (insight.risk === 'low') return 'LOW';
  return 'MEDIUM'; // default stub
}

export function attachGovernanceMetadata(
  crewRole: AICrewRole,
  scope: PlanScope,
  insightType: InsightType,
  insight: any
): GovernanceMetadata {
  const policy = getAIGovernancePolicy(crewRole);
  const allowed = isProposalAllowed(crewRole, scope, insightType);
  return {
    policy: {
      crewRole,
      allowed,
      policyDescription: policy?.description,
    },
    confidenceScore: computeConfidenceScore(insight),
    riskLevel: computeRiskLevel(insight),
  };
}
