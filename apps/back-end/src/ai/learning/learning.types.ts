/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

// Types for LearningSignal, PerformanceSnapshot, LearningInsight

export type LearningSignal =
  | {
      type: 'decision_outcome';
      decisionId: string;
      outcome: 'approved' | 'rejected' | 'overridden';
      confidence: number;
      agentId: string;
      timestamp: number;
    }
  | {
      type: 'approval_latency';
      decisionId: string;
      latencyMs: number;
      agentIds: string[];
      timestamp: number;
    }
  | {
      type: 'rejection_reason';
      decisionId: string;
      reason: string;
      agentId: string;
      timestamp: number;
    }
  | {
      type: 'confidence_vs_result_gap';
      decisionId: string;
      confidence: number;
      result: 'success' | 'failure';
      agentId: string;
      timestamp: number;
    }
  | {
      type: 'human_override';
      decisionId: string;
      agentId: string;
      overrideType: 'approve' | 'reject';
      timestamp: number;
    }
  | {
      type: 'policy_violation';
      decisionId: string;
      policy: string;
      agentId: string;
      timestamp: number;
    }
  | {
      type: 'success_metric';
      decisionId: string;
      metric: string;
      value: number;
      agentId: string;
      timestamp: number;
    };

export interface PerformanceSnapshot {
  decisionId: string;
  executionIntentId?: string;
  scope: string;
  agentIds: string[];
  originalConfidence: number;
  finalOutcome: 'approved' | 'rejected' | 'overridden';
  humanFeedback?: string; // sanitized, no PII
  timestamp: number;
}

export interface LearningInsight {
  insightId: string;
  description: string; // descriptive only, never prescriptive
  relatedDecisionIds: string[];
  agentIds: string[];
  scope: string;
  observedAt: number;
  derivedFrom: Array<'signal' | 'snapshot'>;
}
