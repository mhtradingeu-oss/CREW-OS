import { z } from "zod";

// All explain endpoints require brandId as query param (enforced)
export const explainQuery = z.object({
	brandId: z.string().min(1, { message: "brandId is required" }),
});

export const explainRuleVersionParams = z.object({
	ruleVersionId: z.string().min(1, { message: "ruleVersionId is required" }),
});

export const explainRunParams = z.object({
	runId: z.string().min(1, { message: "runId is required" }),
});

export const explainActionRunParams = z.object({
	actionRunId: z.string().min(1, { message: "actionRunId is required" }),
});
