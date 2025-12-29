
import type { ExplainResponse, ExplainOutcome, ExplainEvidence } from "./types.js";

// Pure builder for ExplainResponse
export function buildExplainResponse({
	summary,
	decisionPath,
	contributingFactors,
	outcome,
	evidence,
}: {
	summary: string;
	decisionPath: string[];
	contributingFactors: string[];
	outcome: ExplainOutcome;
	evidence: ExplainEvidence;
}): ExplainResponse {
	return {
		summary,
		decisionPath,
		contributingFactors,
		outcome,
		confidence: "HIGH",
		evidence,
	};
}
