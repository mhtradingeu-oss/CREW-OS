import { publish } from "../../core/events/event-bus.js";
import { prisma } from "../../core/prisma.js";

/**
 * Persists a performance snapshot for automation metrics and emits automation.metrics.updated.
 * Emits automation.error.detected if errors are present. No execution logic.
 */
export async function persistAutomationMetricsSnapshot({
	brandId,
	period,
	metrics,
	errors,
	actorUserId,
}: {
	brandId: string;
	period: string;
	metrics: Record<string, unknown>;
	errors?: string[];
	actorUserId: string;
}) {
	// Store snapshot as AutomationLog (or similar log model)
	const log = await prisma.automationLog.create({
		data: {
			brandId,
			eventName: "automation.metrics.updated",
			result: "SNAPSHOT",
			detailsJson: JSON.stringify({ metrics, errors, period }),
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
	// Emit metrics updated event
	await publish("automation.metrics.updated", {
		brandId,
		period,
		metrics,
		actorUserId,
		logId: log.id,
	});
	// Emit error detected event if errors present
	if (errors && errors.length > 0) {
		await publish("automation.error.detected", {
			brandId,
			period,
			errors,
			actorUserId,
			logId: log.id,
		});
	}
	return { status: "recorded", logId: log.id };
}
import { computeLatencyMetrics, computeSuccessRate } from "../../core/observability/metrics.js";
import { classifyFailure } from "../../core/observability/failure-classifier.js";
import { findAutomationRunsWithActionRuns } from "../../core/db/repositories/automation.repository.js";
import type {
	AutomationObservabilitySummary,
	RuleVersionMetrics,
	FailureBreakdown,
	TopRuleVersion,
	TopAction,
} from "./automation.observability.types.js";

type AutomationRunForObservability = Awaited<
	ReturnType<typeof findAutomationRunsWithActionRuns>
>[number];
type AutomationActionRunForObservability = AutomationRunForObservability["actionRuns"][number];

// Observability service for Automation OS (Phase 7.1)
// Strictly read-only. See system prompt for architectural constraints.

export async function getRuleVersionMetrics(params: {
	ruleVersionId: string;
	brandId?: string;
	from?: Date;
	to?: Date;
}): Promise<RuleVersionMetrics | null> {
	const runs = await findAutomationRunsWithActionRuns({
		ruleVersionId: params.ruleVersionId,
		brandId: params.brandId,
		from: params.from,
		to: params.to,
	});
	if (!runs.length) return null;

	const totalRuns = runs.length;
	const totalActionRuns = runs.reduce((sum, r) => sum + r.actionRuns.length, 0);
	const runSuccesses = runs.filter((r) => r.status === "SUCCESS").length;
	const actionRuns = runs.flatMap((r) => r.actionRuns);
	const actionSuccesses = actionRuns.filter((a) => a.status === "SUCCESS").length;
	const runLatencies = runs
		.filter((r) => r.startedAt && r.finishedAt)
		.map((r) => new Date(r.finishedAt!).getTime() - new Date(r.startedAt!).getTime());
	const actionLatencies = actionRuns
		.filter((a) => a.startedAt && a.finishedAt)
		.map((a) => new Date(a.finishedAt!).getTime() - new Date(a.startedAt!).getTime());
	const latency = computeLatencyMetrics([...runLatencies, ...actionLatencies]);

	return {
		ruleVersionId: params.ruleVersionId,
		totalRuns,
		totalActionRuns,
		runSuccessRate: computeSuccessRate(runSuccesses, totalRuns),
		actionSuccessRate: computeSuccessRate(actionSuccesses, totalActionRuns),
		latency,
		failureCounts: collectFailureCounts(actionRuns),
	};
}

export async function getSummary(params: {
	brandId: string;
	from: Date;
	to: Date;
}): Promise<AutomationObservabilitySummary> {
	const runs = await findAutomationRunsWithActionRuns({
		brandId: params.brandId,
		from: params.from,
		to: params.to,
	});

	if (!runs.length) {
		return {
			brandId: params.brandId,
			timeRange: { from: params.from, to: params.to },
			totalRuns: 0,
			totalActionRuns: 0,
			runSuccessRate: 0,
			actionSuccessRate: 0,
			latency: { avg: 0, p50: 0, p95: 0 },
			failureCounts: {},
		};
	}

	const totalRuns = runs.length;
	const totalActionRuns = runs.reduce((sum, r) => sum + r.actionRuns.length, 0);
	const runSuccesses = runs.filter((r) => r.status === "SUCCESS").length;
	const actionRuns = runs.flatMap((r) => r.actionRuns);
	const actionSuccesses = actionRuns.filter((a) => a.status === "SUCCESS").length;
	const runLatencies = runs
		.filter((r) => r.startedAt && r.finishedAt)
		.map((r) => new Date(r.finishedAt!).getTime() - new Date(r.startedAt!).getTime());
	const actionLatencies = actionRuns
		.filter((a) => a.startedAt && a.finishedAt)
		.map((a) => new Date(a.finishedAt!).getTime() - new Date(a.startedAt!).getTime());
	const latency = computeLatencyMetrics([...runLatencies, ...actionLatencies]);

	return {
		brandId: params.brandId,
		timeRange: { from: params.from, to: params.to },
		totalRuns,
		totalActionRuns,
		runSuccessRate: computeSuccessRate(runSuccesses, totalRuns),
		actionSuccessRate: computeSuccessRate(actionSuccesses, totalActionRuns),
		latency,
		failureCounts: collectFailureCounts(actionRuns),
	};
}

export async function getFailureBreakdown(params: {
	brandId: string;
	from: Date;
	to: Date;
	groupBy?: "category" | "actionRunner" | "errorCode";
}): Promise<FailureBreakdown> {
	const runs = await findAutomationRunsWithActionRuns({
		brandId: params.brandId,
		from: params.from,
		to: params.to,
	});

	const actionRuns = runs.flatMap((r) => r.actionRuns).filter((a) => a.status !== "SUCCESS");
	if (!actionRuns.length) return { byCategory: {}, byActionRunner: {}, byErrorCode: {} };

	const byCategory: Record<string, number> = {};
	const byActionRunner: Record<string, number> = {};
	const byErrorCode: Record<string, number> = {};
	for (const actionRun of actionRuns) {
		const metadata = extractFailureMetadata(actionRun);
		const category = classifyFailure(metadata);
		byCategory[category] = (byCategory[category] || 0) + 1;
		if (metadata.runnerType) {
			byActionRunner[metadata.runnerType] = (byActionRunner[metadata.runnerType] || 0) + 1;
		}
		if (metadata.errorCode) {
			byErrorCode[metadata.errorCode] = (byErrorCode[metadata.errorCode] || 0) + 1;
		}
	}
	return { byCategory, byActionRunner, byErrorCode };
}

export async function getTop(params: {
	brandId: string;
	from: Date;
	to: Date;
	by: "failures" | "latency" | "volume";
	limit: number;
}): Promise<{ ruleVersions: TopRuleVersion[]; actions: TopAction[] }> {
	const runs = await findAutomationRunsWithActionRuns({
		brandId: params.brandId,
		from: params.from,
		to: params.to,
	});

	if (!runs.length) {
		return { ruleVersions: [], actions: [] };
	}

	const ruleVersionMap = new Map<string, { failures: number; latency: number[]; volume: number }>();
	for (const run of runs) {
		if (!ruleVersionMap.has(run.ruleVersionId)) {
			ruleVersionMap.set(run.ruleVersionId, { failures: 0, latency: [], volume: 0 });
		}
		const entry = ruleVersionMap.get(run.ruleVersionId)!;
		entry.volume += 1;
		if (run.status !== "SUCCESS") entry.failures += 1;
		if (run.startedAt && run.finishedAt) {
			entry.latency.push(new Date(run.finishedAt!).getTime() - new Date(run.startedAt!).getTime());
		}
	}

	const ruleVersions: TopRuleVersion[] = Array.from(ruleVersionMap.entries()).map(([ruleVersionId, summary]) => ({
		ruleVersionId,
		failures: summary.failures,
		latency: summary.latency.length ? summary.latency.reduce((a, b) => a + b, 0) / summary.latency.length : 0,
		volume: summary.volume,
	}));

	const actionMap = new Map<string, { failures: number; latency: number[]; volume: number }>();
	for (const run of runs) {
		for (const actionRun of run.actionRuns) {
			const actionKey = `${actionRun.actionType ?? "unknown"}#${actionRun.actionIndex ?? 0}`;
			if (!actionMap.has(actionKey)) {
				actionMap.set(actionKey, { failures: 0, latency: [], volume: 0 });
			}
			const summary = actionMap.get(actionKey)!;
			summary.volume += 1;
			if (actionRun.status !== "SUCCESS") summary.failures += 1;
			if (actionRun.startedAt && actionRun.finishedAt) {
				summary.latency.push(new Date(actionRun.finishedAt!).getTime() - new Date(actionRun.startedAt!).getTime());
			}
		}
	}

	let actions: TopAction[] = Array.from(actionMap.entries()).map(([actionId, summary]) => ({
		actionId,
		failures: summary.failures,
		latency: summary.latency.length
			? summary.latency.reduce((a, b) => a + b, 0) / summary.latency.length
			: 0,
		volume: summary.volume,
	}));

	const sortKey = params.by;
	const sortedRuleVersions = ruleVersions.sort((a, b) => b[sortKey] - a[sortKey]).slice(0, params.limit);
	actions = actions.sort((a, b) => b[sortKey] - a[sortKey]).slice(0, params.limit);
	return { ruleVersions: sortedRuleVersions, actions };
}

function collectFailureCounts(actionRuns: AutomationActionRunForObservability[]): Record<string, number> {
	const counts: Record<string, number> = {};
	for (const actionRun of actionRuns) {
		if (actionRun.status === "SUCCESS") continue;
		const metadata = extractFailureMetadata(actionRun);
		const category = classifyFailure(metadata);
		counts[category] = (counts[category] || 0) + 1;
	}
	return counts;
}

function extractFailureMetadata(actionRun: AutomationActionRunForObservability) {
	let errorCode: string | undefined;
	let errorMessage: string | undefined;
	let runnerType: string | undefined;
	let gateResult: string | undefined;

	if (actionRun.errorJson && isPlainObject(actionRun.errorJson)) {
		const err = actionRun.errorJson as Record<string, unknown>;
		errorCode = (err["code"] ?? err["errorCode"]) as string | undefined;
		errorMessage = (err["message"] ?? err["errorMessage"]) as string | undefined;
		runnerType = err["runnerType"] as string | undefined;
		gateResult = err["gateResult"] as string | undefined;
	}

	return { errorCode, errorMessage, runnerType, gateResult };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
	return !!val && typeof val === "object" && !Array.isArray(val);
}
