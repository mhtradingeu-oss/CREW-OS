import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { unauthorized } from "../../core/http/errors.js";
import { automationExecutionService } from "./automation.execution.service.js";
import type { ExecuteAutomationActionRequest } from "./automation.execution.types.js";

export async function executeAction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(unauthorized());
    }
    const parsedBody = req.body as ExecuteAutomationActionRequest;
    const correlationId = parsedBody.correlationId ?? req.context?.correlationId;
    const payload: ExecuteAutomationActionRequest = {
      ...parsedBody,
      correlationId,
    };
    const result = await automationExecutionService.execute(payload, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
