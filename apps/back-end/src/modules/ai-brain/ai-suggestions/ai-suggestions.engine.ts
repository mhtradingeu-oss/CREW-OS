import { hashObject } from "../../../core/ai/ai-utils.js";
import type { AIReadOnlySnapshot } from "../ai-read-only/ai-read-only.types.js";
import type {
  AISuggestionEntry,
  AISuggestionType,
  AISuggestionRiskFlag,
  AISuggestionImprovementIdea,
} from "./ai-suggestions.types.js";

const approvalRoleByType: Record<AISuggestionType, string> = {
  risk: "BRAND_ADMIN",
  warning: "COMPANY_ADMIN",
  optimization: "COMPANY_ADMIN",
};

function createSuggestionId(kind: AISuggestionType, snapshotHash: string, label: string) {
  return `${kind}-${hashObject({ snapshotHash, label }).slice(0, 8)}`;
}

function buildAuditMetadata(snapshotHash: string, rationale: string, evidence: string[], suggestedAction: string) {
  return {
    snapshotHash,
    suggestionHash: hashObject({ rationale, evidence, suggestedAction }),
  };
}

function roundConfidence(value: number) {
  return Math.min(1, Math.max(0, Math.round(value * 100) / 100));
}

export function buildSuggestionsFromSnapshot(snapshot: AIReadOnlySnapshot) {
  const { events, metrics, health, config, window, snapshotHash } = snapshot;
  const errorCount = (events.severityCounts.error ?? 0) + (events.severityCounts.critical ?? 0);
  const topModule = events.moduleBreakdown[0]?.module ?? "general";
  const automation = metrics.automationRuns;
  const successRate = automation.successRate ?? 0;
  const averageDuration = automation.averageDurationMs ?? 0;

  const suggestions: AISuggestionEntry[] = [];

  const riskRationale = `Observed ${errorCount} error/critical events in the last ${window.minutes} minute window, with ${topModule} contributing most of the alerts.`;
  const riskEvidence = [
    `Error events: ${errorCount}`,
    `Top module: ${topModule}`,
    `Snapshot hash: ${snapshotHash}`,
  ];
  const riskAction = `Consider coordinating a manual review of ${topModule} before changing automation coverage.`;
  if (errorCount > 0) {
    suggestions.push({
      id: createSuggestionId("risk", snapshotHash, "errors"),
      type: "risk",
      confidence: roundConfidence(0.55 + errorCount / Math.max(events.total, 1) * 0.4),
      rationale: riskRationale,
      evidence: riskEvidence,
      suggestedAction: riskAction,
      approvalMetadata: {
        requiredRole: approvalRoleByType.risk,
        approvalChannel: "ai-suggestions",
      },
      auditMetadata: buildAuditMetadata(snapshotHash, riskRationale, riskEvidence, riskAction),
    });
  }

  if (automation.total && successRate < 0.8) {
    const warningRationale = `Automation success rate is ${Math.round(successRate * 100) / 100} across ${automation.total} recent cycles.`;
    const warningEvidence = [
      `Success rate: ${(successRate * 100).toFixed(1)}%`,
      `Average duration: ${Math.round(averageDuration)}ms`,
    ];
    const warningAction = `Consider aligning human review of automation outcomes with the observed success cadence.`;
    suggestions.push({
      id: createSuggestionId("warning", snapshotHash, "automation"),
      type: "warning",
      confidence: roundConfidence(0.45 + (1 - successRate) * 0.4),
      rationale: warningRationale,
      evidence: warningEvidence,
      suggestedAction: warningAction,
      approvalMetadata: {
        requiredRole: approvalRoleByType.warning,
        approvalChannel: "ai-suggestions",
      },
      auditMetadata: buildAuditMetadata(snapshotHash, warningRationale, warningEvidence, warningAction),
    });
  }

  const optimizationRationale = `Telemetry from ${events.total} events, ${automation.total} automation cycles, and ${health.database.status} database status suggests retaining human oversight.`;
  const optimizationEvidence = [
    `Event count: ${events.total}`,
    `Automation coverage: ${automation.total}`,
  ];
  const optimizationAction = `Maintain human approval on deployments until future approval automation is implemented.`;
  suggestions.push({
    id: createSuggestionId("optimization", snapshotHash, "ops"),
    type: "optimization",
    confidence: roundConfidence(0.35 + (errorCount > 0 ? 0.2 : 0.05)),
    rationale: optimizationRationale,
    evidence: optimizationEvidence,
    suggestedAction: optimizationAction,
    approvalMetadata: {
      requiredRole: approvalRoleByType.optimization,
      approvalChannel: "ai-suggestions",
    },
    auditMetadata: buildAuditMetadata(snapshotHash, optimizationRationale, optimizationEvidence, optimizationAction),
  });

  const statusSeverityMap: Record<AIReadOnlySnapshot["health"]["database"]["status"], "low" | "high"> = {
    ok: "low",
    unreachable: "high",
  };
  const riskFlags: AISuggestionRiskFlag[] = [];
  if (health.database.status !== "ok") {
    riskFlags.push({
      id: `db-${snapshotHash.slice(0, 6)}`,
      description: `Database status is ${health.database.status}.`,
      severity: statusSeverityMap[health.database.status],
      evidence: [`Uptime: ${health.uptimeSeconds} seconds`, `Status checked at: ${health.readiness.checkedAt}`],
    });
  }
  if (errorCount > 3) {
    riskFlags.push({
      id: `errors-${snapshotHash.slice(0, 6)}`,
      description: `Multiple error-level events (${errorCount}) detected.`,
      severity: "medium",
      evidence: [`Window minutes: ${window.minutes}`, `Top severity: error/critical`],
    });
  }
  if (successRate < 0.6) {
    riskFlags.push({
      id: `success-${snapshotHash.slice(0, 6)}`,
      description: `Automation success rate below 60%.`,
      severity: "medium",
      evidence: [`Success rate: ${(successRate * 100).toFixed(1)}%`, `Automation logs used: ${automation.total}`],
    });
  }

  const improvementIdeas: AISuggestionImprovementIdea[] = [];
  if (events.total < 10) {
    improvementIdeas.push({
      id: `telemetry-${snapshotHash.slice(0, 6)}`,
      focus: "Telemetry depth",
      detail: `Gather more activity log entries so the advisory context grows richer in future windows.`,
    });
  }
  if (config.featureFlags.some((flag) => flag.aiInsights)) {
    improvementIdeas.push({
      id: `flags-${snapshotHash.slice(0, 6)}`,
      focus: "Feature coverage",
      detail: `Review plan feature flags to ensure AI insights stay aligned with enabled modules.`,
    });
  }
  improvementIdeas.push({
    id: `review-${snapshotHash.slice(0, 6)}`,
    focus: "Human oversight",
    detail: "Keep a human in the loop for final approval until approval workflows are implemented.",
  });

  return {
    suggestions,
    riskFlags: riskFlags.slice(0, 3),
    improvementIdeas: improvementIdeas.slice(0, 3),
  };
}
