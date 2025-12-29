// PHASE 8.0 LOCK: ExecutionIntent Types (DATA-ONLY, NO EXECUTION)
// All fields are immutable, no execution allowed

import { DecisionObject } from '../decision/decision.types.js';

export type ExecutionIntentRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ExecutionIntentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const STRICT_APPROVAL_MODE = true;

export interface ExecutionIntent {
  intentId: string; // uuid
  decisionId: string;
  scope: string;
  createdAt: string; // ISO
  createdBy: string; // userId only
  requestedByRole: string;
  riskLevel: ExecutionIntentRiskLevel;
  requiresApproval: boolean;
  approval: {
    status: ExecutionIntentStatus;
    approvedBy?: string;
    approvedAt?: string;
    reason?: string;
  };
  plan: {
    kind: 'AUTOMATION_RULE_CHANGE' | 'AUTOMATION_RUN_REQUEST' | 'NOTIFICATION_DRAFT' | 'MEDIA_DRAFT' | 'AUDIO_DRAFT' | 'OTHER';
    summary: string;
    steps: string[];
  };
  constraints: {
    executionDisabled: true;
    automationDisabled: true;
    mediaDisabled: true;
    audioDisabled: true;
  };
  safety: {
    blocked: boolean;
    reasons: string[];
    policyRefs?: string[];
  };
}

export interface HandoffPayload {
  intentId: string;
  decisionId: string;
  status: ExecutionIntentStatus;
  plan: ExecutionIntent['plan'];
  constraints: ExecutionIntent['constraints'];
  banner: string;
}

export type { DecisionObject };
