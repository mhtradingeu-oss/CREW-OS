import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { coreAutomationEngine } from "../../core/automation/core-engine.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function executeAutomationEvent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { eventName, payload, context } = req.body;
    const mergedContext = {
      brandId: context?.brandId ?? req.user?.brandId ?? null,
      tenantId: context?.tenantId ?? req.user?.tenantId ?? null,
      actorUserId: context?.actorUserId ?? req.user?.id ?? null,
      correlationId: context?.correlationId ?? req.context?.correlationId ?? null,
    };
    const result = await coreAutomationEngine.executeAutomationEvent(eventName, payload, mergedContext);
    respondWithSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
