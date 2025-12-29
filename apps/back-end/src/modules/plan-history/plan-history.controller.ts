import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import type { Response, NextFunction } from "express";
import { respondWithSuccess } from "../../core/http/respond.js";
import { planHistoryService } from "./plan-history.service.js";

export async function listHandler(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user?.id) return next();
    const items = await planHistoryService.listPlanHistory(req.user.id);
    return respondWithSuccess(res, items);
  } catch (err) {
    return next(err);
  }
}
