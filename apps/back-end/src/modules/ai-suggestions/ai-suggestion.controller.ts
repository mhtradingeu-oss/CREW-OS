import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/http/http-types.js";
import { AISuggestionService } from "./ai-suggestion.service.js";
import { forbidden, notFound, badRequest, unauthorized } from "../../core/http/errors.js";
import { buildExecutionPlanFromSuggestion } from "./ai-suggestion.execution-mapper.js";
import * as executor from "../../core/automation/executor/executor.js";
import { publish } from "../../core/events/event-bus.js";
import { getPermissionsForRole } from "../../core/security/rbac.js";
// POST /api/v1/ai-suggestions/:id/execute (internal, ops/admin)
export async function executeSuggestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const suggestionArr = await service.repo.listSuggestions({ filter: { id } });
    const suggestion = suggestionArr[0];
    if (!suggestion) return next(notFound("Suggestion not found"));
    if (suggestion.status !== "approved") {
      return next(badRequest("Suggestion is not approved"));
    }
    // Build execution plan from suggestion
    const plan = buildExecutionPlanFromSuggestion({
      suggestionId: suggestion.id,
      domain: suggestion.domain,
      suggestionType: suggestion.suggestionType,
      proposedOutputJson: suggestion.proposedOutputJson,
    });
    if ("error" in plan) {
      // Audit log for failed execution plan
      await publish(
        "ai.suggestion.failed",
        {
          suggestionId: suggestion.id,
          correlationId: suggestion.correlationId || suggestion.id,
          eventType: "ai.suggestion.failed",
          inputSnapshot: redactSecrets(safeParseJson(suggestion.inputSnapshotJson)),
          outputSnapshot: { error: plan.error, details: plan.details },
        },
        {
          actorUserId: req.user?.id,
          brandId: suggestion.brandId,
          tenantId: suggestion.tenantId,
          module: "ai-suggestions",
        }
      );
      return next(badRequest(plan.error, plan.details));
    }
    // Simulate execution result
    const executionResult = { steps: plan.steps, status: "executed" };
    // Audit log for successful execution
    await publish(
      "ai.suggestion.executed",
      {
        suggestionId: suggestion.id,
        correlationId: suggestion.correlationId || suggestion.id,
        eventType: "ai.suggestion.executed",
        inputSnapshot: redactSecrets(safeParseJson(suggestion.inputSnapshotJson)),
        outputSnapshot: redactSecrets(executionResult),
      },
      {
        actorUserId: req.user?.id,
        brandId: suggestion.brandId,
        tenantId: suggestion.tenantId,
        module: "ai-suggestions",
      }
    );
    res.status(200).json({ status: "executed", suggestionId: suggestion.id });
  } catch (err) {
    // Audit log for execution failure
    if (req?.params?.id) {
      await publish(
        "ai.suggestion.failed",
        {
          suggestionId: req.params.id,
          correlationId: req.params.id,
          eventType: "ai.suggestion.failed",
          error: err instanceof Error ? err.message : String(err),
        },
        {
          actorUserId: req.user?.id,
          module: "ai-suggestions",
        }
      );
    }
    next(err);
  }
}
// --- Helpers ---
function safeParseJson(json: any) {
  if (!json || typeof json !== "string") return undefined;
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function redactSecrets(obj: any) {
  // Simple redaction: remove keys named 'secret', 'apiKey', 'token' (case-insensitive)
  if (!obj || typeof obj !== "object") return obj;
  const SENSITIVE = ["secret", "apiKey", "token", "password"];
  const redact = (val: any): any => {
    if (Array.isArray(val)) return val.map(redact);
    if (val && typeof val === "object") {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) =>
          SENSITIVE.includes(k.toLowerCase())
            ? [k, "[REDACTED]"]
            : [k, redact(v)]
        )
      );
    }
    return val;
  };
  return redact(obj);
}


const service = new AISuggestionService();

function getUserRole(req: AuthenticatedRequest) {
  return req.user?.role || "";
}
export async function listSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

async function checkApprovalPermission(suggestion: any, req: AuthenticatedRequest) {
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

export async function approveSuggestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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

export async function rejectSuggestion(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
