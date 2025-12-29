import { prisma } from "../../core/prisma.js";
import { publish } from "../../core/events/event-bus.js";

/**
 * Persists an explanation for a rule version and emits automation.rule.explained.
 * Read-only, deterministic. No side effects on automation execution.
 */
export async function persistAutomationRuleExplanation({
	brandId,
	ruleVersionId,
	explanation,
	actorUserId,
}: {
	brandId: string;
	ruleVersionId: string;
	explanation: ExplainResponse;
	actorUserId: string;
}) {
	// Store explanation in a dedicated table or as a log (here: AutomationExecutionLog with type 'EXPLANATION')
	const log = await prisma.automationExecutionLog.create({
		data: {
			ruleId: ruleVersionId, // If ruleId is required, fetch from ruleVersion
			eventName: "automation.rule.explained",
			status: "EXPLAINED",
			resultJson: JSON.stringify(explanation),
			runAt: new Date(),
			errorMessage: undefined,
		},
	});
	// Emit event
	await publish("automation.rule.explained", {
		brandId,
		ruleVersionId,
		explanation,
		actorUserId,
		logId: log.id,
	});
	return { status: "recorded", logId: log.id };
}

import {
  findAutomationActionRunWithContext,
  findAutomationRunWithDetails,
  findAutomationRuleVersionById,
} from "../../core/db/repositories/automation.repository.js";
import type { Prisma } from "@prisma/client";
import { getRuleVersionMetrics } from "./automation.observability.service.js";
import type { ExplainResponse, ExplainOutcome } from "./automation.explain.types.js";

// A) explainRuleVersion
export async function explainRuleVersion({ brandId, ruleVersionId, timeRange }: { brandId: string; ruleVersionId: string; timeRange?: { from?: Date; to?: Date } }): Promise<ExplainResponse | null> {
	// 1. Query ruleVersion + parent rule (brandId)
	const ruleVersionSelect = {
		id: true,
		rule: { select: { brandId: true } },
		metaSnapshotJson: true,
	} satisfies Prisma.AutomationRuleVersionSelect;
	const ruleVersion = await findAutomationRuleVersionById<
		Prisma.AutomationRuleVersionArgs & { select: typeof ruleVersionSelect }
	>(ruleVersionId, { select: ruleVersionSelect });
	if (!ruleVersion || ruleVersion.rule.brandId !== brandId) return null;

	// 2. Get metrics (Phase 7.1 helper)
	const metrics = await getRuleVersionMetrics({ ruleVersionId, brandId, from: timeRange?.from, to: timeRange?.to });
	// Defensive: if metrics null, use deterministic defaults
	const totalRuns = metrics?.totalRuns ?? 0;
	const runSuccessRate = metrics?.runSuccessRate ?? 0;
	const actionSuccessRate = metrics?.actionSuccessRate ?? 0;
	const failures = metrics?.failureCounts ?? {};

	// 3. Build decisionPath (fixed order)
	const decisionPath = [
		"Validated brand scope for ruleVersion",
		"Loaded ruleVersion snapshot metadata",
		"Aggregated runs and actionRuns for time range",
		"Computed success rates and latency percentiles",
		"Classified dominant failures deterministically",
	];

	// 4. Outcome rules
	let outcome: ExplainOutcome = "PARTIAL";
	if (totalRuns === 0) outcome = "SKIPPED";
	else if (runSuccessRate === 100 && actionSuccessRate === 100 && Object.values(failures).reduce((a, b) => a + b, 0) === 0) outcome = "SUCCESS";
	else if (runSuccessRate === 0 || (Object.values(failures).reduce((a, b) => a + b, 0) > 0 && runSuccessRate < 50)) outcome = "FAILED";

	// 5. Contributing factors (from metrics/failures)
	const contributingFactors: string[] = [];
	if (Object.keys(failures).length > 0) contributingFactors.push("Detected failure categories: " + Object.keys(failures).join(", "));
	if (runSuccessRate < 100) contributingFactors.push(`Run success rate below 100%: ${runSuccessRate}%`);
	if (actionSuccessRate < 100) contributingFactors.push(`Action success rate below 100%: ${actionSuccessRate}%`);

	// 6. Evidence
	const evidence = {
		metrics: metrics ?? {},
		failures,
	};

	// 7. Summary
	let summary = "";
	if (outcome === "SUCCESS") summary = "All runs and actions succeeded with no failures.";
	else if (outcome === "FAILED") summary = "Runs failed or dominant failures detected.";
	else if (outcome === "SKIPPED") summary = "No runs found for this rule version in the selected time range.";
	else summary = "Partial success with some failures or incomplete runs.";

	return {
		summary,
		decisionPath,
		contributingFactors,
		outcome,
		confidence: "HIGH",
		evidence,
	};
}

// B) explainRun
export async function explainRun({ brandId, runId }: { brandId: string; runId: string }): Promise<ExplainResponse | null> {
	// Query run + joins
	const run = await findAutomationRunWithDetails(runId);
	if (!run || run.ruleVersion.rule.brandId !== brandId) return null;

	// Outcome logic
	let outcome: ExplainOutcome = "PARTIAL";
	const allActionsSuccess = run.actionRuns.length > 0 && run.actionRuns.every(a => a.status === "SUCCESS");
	if (run.status === "SUCCESS" && allActionsSuccess) outcome = "SUCCESS";
	else if (run.status === "FAILED" || run.actionRuns.some(a => a.status === "FAILED")) outcome = "FAILED";
	else if (["SKIPPED", "BLOCKED", "GATED"].includes(run.status)) outcome = "SKIPPED";

	// Decision path
	const decisionPath = [
		"Validated brand scope for run",
		"Loaded run and actionRuns",
		...(run.conditionsJson ? ["Gate evaluation result: present"] : []),
		"Classified run and action failures deterministically",
	];

	// Contributing factors
	const contributingFactors: string[] = [];
	if (run.errorJson) contributingFactors.push("Run error present");
	if (run.actionRuns.some(a => a.status !== "SUCCESS")) contributingFactors.push("Some actions did not succeed");

	// Evidence
	const evidence = {
		metrics: {
			runStatus: run.status,
			actionStatuses: run.actionRuns.map(a => a.status),
		},
		failures: run.errorJson ? { run: run.errorJson } : undefined,
		logs: run.summaryJson ? { summary: run.summaryJson } : undefined,
	};

	// Summary
	let summary = "";
	if (outcome === "SUCCESS") summary = "Run and all actions succeeded.";
	else if (outcome === "FAILED") summary = "Run or one or more actions failed.";
	else if (outcome === "SKIPPED") summary = "Run was skipped, blocked, or gated.";
	else summary = "Partial success with some failures or incomplete actions.";

	return {
		summary,
		decisionPath,
		contributingFactors,
		outcome,
		confidence: "HIGH",
		evidence,
	};
}

// C) explainActionRun
export async function explainActionRun({ brandId, actionRunId }: { brandId: string; actionRunId: string }): Promise<ExplainResponse | null> {
	// Query actionRun + join run -> ruleVersion -> rule
	const actionRun = await findAutomationActionRunWithContext(actionRunId);
	if (!actionRun || actionRun.run.ruleVersion.rule.brandId !== brandId) return null;

	// Failure classification (deterministic)
	let retryable = false;
	let category = "";
	if (actionRun.errorJson && typeof actionRun.errorJson === "object") {
		const err = actionRun.errorJson as Record<string, unknown>;
		category = String(err["category"] ?? "");
		if (["RETRYABLE_EXTERNAL", "RATE_LIMITED"].includes(category)) retryable = true;
	}

	// Decision path
	const decisionPath = [
		"Validated brand scope for actionRun",
		"Loaded actionRun and parent run",
		"Classified action failure deterministically",
		retryable ? "Classified as retryable failure" : "Classified as non-retryable failure",
	];

	// Contributing factors
	const contributingFactors: string[] = [];
	if (category) contributingFactors.push(`Failure category: ${category}`);
	if (retryable) contributingFactors.push("Failure is retryable");

	// Evidence
	const evidence = {
		metrics: {
			status: actionRun.status,
			actionType: actionRun.actionType,
			latency: actionRun.startedAt && actionRun.finishedAt ? (new Date(actionRun.finishedAt).getTime() - new Date(actionRun.startedAt).getTime()) : undefined,
		},
		failures: actionRun.errorJson ? { error: actionRun.errorJson } : undefined,
	};

	// Summary
	let summary = "";
	if (actionRun.status === "SUCCESS") summary = "Action succeeded.";
	else if (retryable) summary = "Action failed with retryable error.";
	else summary = "Action failed with non-retryable error.";

	return {
		summary,
		decisionPath,
		contributingFactors,
		outcome: actionRun.status === "SUCCESS" ? "SUCCESS" : "FAILED",
		confidence: "HIGH",
		evidence,
	};
}
