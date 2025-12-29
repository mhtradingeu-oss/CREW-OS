// Zod validators for Automation Observability endpoints
// Strictly read-only. See system prompt for architectural constraints.

import { z } from "zod";

// Shared Zod schemas for brandId, time range, etc. (import from shared if available)
export const summaryQuerySchema = z.object({
	brandId: z.string().min(1),
	from: z.coerce.date(),
	to: z.coerce.date(),
});

export const ruleVersionParamSchema = z.object({
	ruleVersionId: z.string().min(1),
});

export const failuresQuerySchema = z.object({
	brandId: z.string().min(1),
	from: z.coerce.date(),
	to: z.coerce.date(),
	groupBy: z.enum(["category", "actionRunner", "errorCode"]).optional(),
});

export const topQuerySchema = z.object({
	brandId: z.string().min(1),
	from: z.coerce.date(),
	to: z.coerce.date(),
	by: z.enum(["failures", "latency", "volume"]),
	limit: z.coerce.number().int().min(1).max(50).default(10),
});
