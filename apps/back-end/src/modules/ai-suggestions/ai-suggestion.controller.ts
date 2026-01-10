import type { Response, NextFunction, Request } from "express";

import { AISuggestionService } from "./ai-suggestion.service.js";
import { forbidden, notFound, badRequest, unauthorized } from "../../core/http/errors.js";
import { getPermissionsForRole } from "../../core/security/rbac.js";
import { automationExecutionService } from "../../modules/automation/automation.execution.service.js";
import type { ExecuteAutomationActionRequest } from "../../modules/automation/automation.execution.types.js";
import type { ExecuteAiSuggestionRequest } from "./ai-suggestion.execution.validators.js";
// POST /api/v1/ai-suggestions/:id/execute (internal, ops/admin)
export async function executeSuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const suggestionId = req.params.id;
    if (!suggestionId) {
      return next(badRequest("Missing suggestion id"));
    }
    const userId = req.user?.id;
    if (!userId) return next(unauthorized());
    const payload = req.body as ExecuteAiSuggestionRequest;
    const correlationId =
      payload.correlationId ??
      ((req as Request & { context?: { correlationId?: string } }).context?.correlationId);
    const executionPayload: ExecuteAutomationActionRequest = {
      ...payload,
      suggestionId,
      correlationId,
    };
    const result = await automationExecutionService.execute(executionPayload, userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


const service = new AISuggestionService();

function getUserRole(req: Request) {
  return req.user?.role || "";
}
export async function listSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, domain, tenantId, brandId } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (domain) filter.domain = domain;
    if (tenantId) filter.tenantId = tenantId;
    if (brandId) filter.brandId = brandId;
    const suggestions = await service.repo.listSuggestions({ filter });
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}

async function checkApprovalPermission(suggestion: any, req: Request) {
  const userRole = getUserRole(req);
  if (!userRole) throw unauthorized();
  if (userRole === "SUPER_ADMIN") return true; // If global bypass is already policy
  const requiredRole = suggestion.requiredApprovalRole;
  if (!requiredRole) throw forbidden("No requiredApprovalRole");
  if (userRole === requiredRole) return true;
  // Check permission codes for role
  const perms = await getPermissionsForRole(userRole);
  if (!perms.includes(`ai-suggestion:approve:${requiredRole}`)) throw forbidden();
  return true;
}

export async function approveSuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const suggestion = await service.repo.listSuggestions({ filter: { id } });
    if (!suggestion[0]) throw notFound("Suggestion not found");
    await checkApprovalPermission(suggestion[0], req);
    const { user } = req;
    if (!user?.id) throw forbidden("Missing user id");
    const userId = user.id;
    const result = await service.approveSuggestion(id!, userId!);
    // Always return status: 'approved' for idempotency
    res.json({ ...result, status: "approved" });
  } catch (err) {
    next(err);
  }
}

export async function rejectSuggestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const suggestion = await service.repo.listSuggestions({ filter: { id } });
    if (!suggestion[0]) throw notFound("Suggestion not found");
    await checkApprovalPermission(suggestion[0], req);
    const { user } = req;
    if (!user?.id) throw forbidden("Missing user id");
    const userId = user.id;
    const result = await service.rejectSuggestion(id!, userId!, reason);
    // Always return status: 'rejected' for idempotency
    res.json({ ...result, status: "rejected" });
  } catch (err) {
    next(err);
  }
}
