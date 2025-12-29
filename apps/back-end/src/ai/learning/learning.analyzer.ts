/**
 * PHASE 9 — LEARNING LOOP
 * This module observes outcomes only.
 * It cannot execute, automate, approve, or modify decisions.
 */

import type { LearningSignal, PerformanceSnapshot, LearningInsight } from './learning.types.js';

// Deterministic, pure analysis only
export function analyzeSignals(
  signals: LearningSignal[],
  snapshots: PerformanceSnapshot[]
): LearningInsight[] {
  // Example: Overconfidence detection
  const insights: LearningInsight[] = [];
  const now = Date.now();

  // Example: Agent overconfidence
  for (const snap of snapshots) {
    if (snap.originalConfidence > 0.8 && snap.finalOutcome === 'rejected') {
      insights.push({
        insightId: `overconfidence-${snap.decisionId}`,
        description: `Agent(s) ${snap.agentIds.join(', ')} overconfident in scope ${snap.scope}`,
        relatedDecisionIds: [snap.decisionId],
        agentIds: snap.agentIds,
        scope: snap.scope,
        observedAt: now,
        derivedFrom: ['snapshot'],
      });
    }
  }

  // Example: High rejection rate for medium risk
  const mediumRiskRejections = snapshots.filter(
    (s) => s.scope.includes('risk=medium') && s.finalOutcome === 'rejected'
  );
  if (mediumRiskRejections.length > 2) {
    insights.push({
      insightId: `high-rejection-medium-risk-${now}`,
      description: 'High rejection rate for risk=medium',
      relatedDecisionIds: mediumRiskRejections.map((s) => s.decisionId),
      agentIds: Array.from(new Set(mediumRiskRejections.flatMap((s) => s.agentIds))),
      scope: 'risk=medium',
      observedAt: now,
      derivedFrom: ['snapshot'],
    });
  }

  // Example: Approval latency with >2 agents
  const latencySignals = signals.filter(
    (s): s is Extract<LearningSignal, { type: 'approval_latency' }> =>
      s.type === 'approval_latency' && s.agentIds.length > 2 && s.latencyMs > 1000
  );
  if (latencySignals.length > 0) {
    insights.push({
      insightId: `latency-multi-agent-${now}`,
      description: 'Approval latency increases when >2 agents involved',
      relatedDecisionIds: latencySignals.map((s) => s.decisionId),
      agentIds: Array.from(new Set(latencySignals.flatMap((s) => s.agentIds))),
      scope: 'multi-agent',
      observedAt: now,
      derivedFrom: ['signal'],
    });
  }

  // Example: Divergence in agent recommendations
  // (For demonstration, not implemented: would require more signal types)

  return insights;
}
