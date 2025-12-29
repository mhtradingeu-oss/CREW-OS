
// Pure deterministic decision path builders

export function buildRuleVersionDecisionPath(): string[] {
	return [
		"Validated brand scope for ruleVersion",
		"Loaded ruleVersion snapshot metadata",
		"Aggregated runs and actionRuns for time range",
		"Computed success rates and latency percentiles",
		"Classified dominant failures deterministically",
	];
}

export function buildRunDecisionPath(run: { status: string }, gates?: string | null): string[] {
	const path = [
		"Validated brand scope for run",
		"Loaded run and actionRuns",
	];
	if (gates) path.push(`Gate evaluation result: ${gates}`);
	path.push("Classified run and action failures deterministically");
	return path;
}

export function buildActionDecisionPath(actionRun: { status: string }, retryable?: boolean): string[] {
	return [
		"Validated brand scope for actionRun",
		"Loaded actionRun and parent run",
		"Classified action failure deterministically",
		retryable ? "Classified as retryable failure" : "Classified as non-retryable failure",
	];
}
