// Types for Automation Observability (Phase 7.1)
// Strictly read-only. See system prompt for architectural constraints.

export interface AutomationObservabilitySummary {
	brandId: string;
	timeRange: { from: Date; to: Date };
	totalRuns: number;
	totalActionRuns: number;
	runSuccessRate: number; // 0-1
	actionSuccessRate: number; // 0-1
	latency: LatencyMetrics;
	failureCounts: Record<string, number>; // by failure category
}

export interface LatencyMetrics {
	avg: number; // ms
	p50: number; // ms
	p95: number; // ms
}

export interface RuleVersionMetrics {
	ruleVersionId: string;
	totalRuns: number;
	totalActionRuns: number;
	runSuccessRate: number;
	actionSuccessRate: number;
	latency: LatencyMetrics;
	failureCounts: Record<string, number>;
}

export interface FailureBreakdown {
	byCategory: Record<string, number>;
	byActionRunner: Record<string, number>;
	byErrorCode: Record<string, number>;
}

export interface TopRuleVersion {
	ruleVersionId: string;
	failures: number;
	latency: number;
	volume: number;
}

export interface TopAction {
	actionId: string;
	failures: number;
	latency: number;
	volume: number;
}
