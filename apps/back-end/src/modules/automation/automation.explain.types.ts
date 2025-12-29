
// @ts-expect-type-only
export type ExplainOutcome = "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED";

export type ExplainEvidence = {
	metrics?: Record<string, unknown>; // فقط payloadات محسوبة/مقروءة (لا any)
	logs?: Record<string, unknown>;
	failures?: Record<string, unknown>;
};

export type ExplainResponse = {
	summary: string;
	decisionPath: string[];
	contributingFactors: string[];
	outcome: ExplainOutcome;
	confidence: "HIGH";
	evidence: ExplainEvidence;
};
