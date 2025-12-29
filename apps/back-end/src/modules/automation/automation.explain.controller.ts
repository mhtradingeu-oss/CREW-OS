// Automation Explainability Controller (Phase 7.2)
// Strictly read-only. See system prompt for architectural constraints.


import type { Request, Response, NextFunction } from "express";

export async function explainRuleVersion(req: Request, res: Response, next: NextFunction) {
	res.status(501).json({ message: "Not implemented" });
}

export async function explainRun(req: Request, res: Response, next: NextFunction) {
	res.status(501).json({ message: "Not implemented" });
}

export async function explainActionRun(req: Request, res: Response, next: NextFunction) {
	res.status(501).json({ message: "Not implemented" });
}
