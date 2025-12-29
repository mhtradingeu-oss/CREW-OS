
import type { ExplainOutcome } from "./types.js";

// Pure deterministic outcome resolver for ruleVersion
export function resolveRuleVersionOutcome(metrics: { totalRuns: number; runSuccessRate: number; actionSuccessRate: number }, failures: Record<string, number>): ExplainOutcome {
	if (metrics.totalRuns === 0) return "SKIPPED";
	const totalFailures = Object.values(failures).reduce((a, b) => a + b, 0);
	if (metrics.runSuccessRate === 100 && metrics.actionSuccessRate === 100 && totalFailures === 0) return "SUCCESS";
	if (metrics.runSuccessRate === 0 || (totalFailures > 0 && metrics.runSuccessRate < 50)) return "FAILED";
	return "PARTIAL";
}

// Pure deterministic outcome resolver for run
export function resolveRunOutcome(run: { status: string }, actionRuns: { status: string }[]): ExplainOutcome {
	const allActionsSuccess = actionRuns.length > 0 && actionRuns.every(a => a.status === "SUCCESS");
	if (run.status === "SUCCESS" && allActionsSuccess) return "SUCCESS";
	if (run.status === "FAILED" || actionRuns.some(a => a.status === "FAILED")) return "FAILED";
	if (["SKIPPED", "BLOCKED", "GATED"].includes(run.status)) return "SKIPPED";
	return "PARTIAL";
}

// Pure deterministic outcome resolver for actionRun
export function resolveActionRunOutcome(actionRun: { status: string }, failureCategory?: string): ExplainOutcome {
	if (actionRun.status === "SUCCESS") return "SUCCESS";
	return "FAILED";
}
