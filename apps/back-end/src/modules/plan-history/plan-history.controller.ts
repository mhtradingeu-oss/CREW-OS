
import type { Request, Response, NextFunction } from "express";
import { respondWithSuccess } from "../../core/http/respond.js";
import { planHistoryService } from "./plan-history.service.js";

export async function listHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const typedReq = req as Request & { user?: { id?: string } };
    if (!typedReq.user?.id) return next();
    const items = await planHistoryService.listPlanHistory(typedReq.user.id);
    return respondWithSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}
