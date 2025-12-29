// Observability controller for Automation OS (Phase 7.1)
// Strictly read-only. See system prompt for architectural constraints.

import type { Request, Response } from "express";
import * as service from "./automation.observability.service.js";
import {
	summaryQuerySchema,
	ruleVersionParamSchema,
	failuresQuerySchema,
	topQuerySchema,
} from "./automation.observability.validators.js";

export async function getSummary(req: Request, res: Response) {
	const query = summaryQuerySchema.parse(req.query);
	const data = await service.getSummary(query);
	res.json(data);
}

export async function getRuleVersionMetrics(req: Request, res: Response) {
	const params = ruleVersionParamSchema.parse(req.params);
	const brandId = typeof req.query.brandId === 'string' ? req.query.brandId : undefined;
	if (!brandId) {
		res.status(400).json({ error: 'brandId is required' });
		return;
	}
	const { from, to } = req.query;
	let fromDate: Date | undefined = undefined;
	let toDate: Date | undefined = undefined;
	if (from) fromDate = new Date(from as string);
	if (to) toDate = new Date(to as string);
	try {
		const data = await service.getRuleVersionMetrics({
			ruleVersionId: params.ruleVersionId,
			brandId,
			from: fromDate,
			to: toDate,
		});
		if (!data) {
			res.status(404).json({ error: 'Not found' });
			return;
		}
		res.json(data);
	} catch (err) {
		res.status(500).json({ error: 'Internal error' });
	}
}

export async function getFailureBreakdown(req: Request, res: Response) {
	const query = failuresQuerySchema.parse(req.query);
	const data = await service.getFailureBreakdown(query);
	res.json(data);
}

export async function getTop(req: Request, res: Response) {
	const query = topQuerySchema.parse(req.query);
	const data = await service.getTop(query);
	res.json(data);
}
