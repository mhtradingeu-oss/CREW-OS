import type { Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { adminService } from "./admin.service.js";
import {
  aiSummarySchema,
  aiRestrictionSchema,
  auditLogSchema,
  policySchema,
} from "./admin.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { parsePagination } from "../../core/http/pagination.js";

export async function listPolicies(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;
    const pagination = parsePagination(req.query);
    const items = await adminService.listPolicies({
      search: typeof search === "string" ? search : undefined,
      ...pagination,
    });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getPolicy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await adminService.getPolicy(requireParam(req.params.id, "id"));
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createPolicy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = policySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await adminService.createPolicy(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updatePolicy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = policySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await adminService.updatePolicy(requireParam(req.params.id, "id"), parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deletePolicy(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminService.deletePolicy(requireParam(req.params.id, "id"));
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listAIRestrictions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { search } = req.query;
    const pagination = parsePagination(req.query);
    const items = await adminService.listAIRestrictions({
      search: typeof search === "string" ? search : undefined,
      ...pagination,
    });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function createAIRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = aiRestrictionSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await adminService.createAIRestriction(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAIRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = aiRestrictionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await adminService.updateAIRestriction(requireParam(req.params.id, "id"), parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteAIRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await adminService.deleteAIRestriction(requireParam(req.params.id, "id"));
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listAuditLogs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = auditLogSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const items = await adminService.listAuditLogs(parsed.data);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function aiAuditSummary(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = aiSummarySchema.parse(req.body);
    const summary = await adminService.summarizeAI({
      ...parsed,
      tenantId: req.user?.tenantId,
    });
    respondWithSuccess(res, summary, 201);
  } catch (err) {
    next(err);
  }
}

export async function listAITelemetry(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const data = await adminService.getAITelemetry({
      brandId: req.user?.brandId ?? null,
      tenantId: req.user?.tenantId ?? null,
    });
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}
