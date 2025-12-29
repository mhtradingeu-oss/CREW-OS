// Deterministic failure classifier for Automation Observability
// See system prompt for allowed categories and constraints.

export type FailureCategory =
	| "RETRYABLE_EXTERNAL"
	| "VALIDATION_ERROR"
	| "POLICY_BLOCKED"
	| "RATE_LIMITED"
	| "ACTION_TIMEOUT"
	| "UNKNOWN_INTERNAL";

interface FailureClassifierInput {
	errorCode?: string;
	errorMessage?: string;
	runnerType?: string;
	gateResult?: string;
}

export function classifyFailure(input: FailureClassifierInput): FailureCategory {
	const { errorCode = "", errorMessage = "", runnerType = "", gateResult = "" } = input;
	// Deterministic rules only
	if (errorCode.startsWith("EXT_")) return "RETRYABLE_EXTERNAL";
	if (errorCode === "VALIDATION_FAILED" || errorMessage.includes("validation")) return "VALIDATION_ERROR";
	if (errorCode === "POLICY_BLOCKED" || gateResult === "BLOCKED") return "POLICY_BLOCKED";
	if (errorCode === "RATE_LIMITED") return "RATE_LIMITED";
	if (errorCode === "TIMEOUT" || errorMessage.includes("timeout")) return "ACTION_TIMEOUT";
	return "UNKNOWN_INTERNAL";
}
