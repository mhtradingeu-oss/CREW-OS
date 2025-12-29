// Metrics helpers for Automation Observability
// Strictly read-only. See system prompt for architectural constraints.

export interface LatencyMetrics {
	avg: number;
	p50: number;
	p95: number;
}

export function computeLatencyMetrics(latencies: number[]): LatencyMetrics {
	if (!latencies.length) return { avg: 0, p50: 0, p95: 0 };
	const sorted = [...latencies].sort((a, b) => a - b);
	const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
	const p50 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.5)] ?? 0 : 0;
	const p95 = sorted.length > 0 ? sorted[Math.floor(sorted.length * 0.95)] ?? 0 : 0;
	return { avg, p50, p95 };
}

export function computeSuccessRate(successes: number, total: number): number {
	if (total === 0) return 0;
	return successes / total;
}
