import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { operatorAuditService } from "./operator-audit.service.js";
import {
  timelineQuerySchema,
  approvalDetailParams,
  executionDetailParams,
} from "./operator-audit.validators.js";
function buildFilters(req: AuthenticatedRequest) {
  const parsed = timelineQuerySchema.parse(req.query);
  const scopedBrand = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role, tenantId: req.user?.tenantId },
    parsed.brandId,
  );
  const brandId = scopedBrand ?? parsed.brandId ?? undefined;
  return {
    ...parsed,
    brandId,
  };
}

function enforceBrandScope(brandId: string | undefined, req: AuthenticatedRequest) {
  if (!brandId) return;
  resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role, tenantId: req.user?.tenantId },
    brandId,
  );
}

export async function listSnapshots(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listSnapshots(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listSuggestions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listSuggestions(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listApprovals(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listApprovals(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getApprovalDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = approvalDetailParams.parse(req.params);
    const detail = await operatorAuditService.getApprovalDetail(params.id);
    enforceBrandScope(detail.brand?.id, req);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function listExecutions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listExecutions(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getExecutionDetail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const params = executionDetailParams.parse(req.params);
    const detail = await operatorAuditService.getExecutionDetail(params.id);
    enforceBrandScope(detail.brand?.id, req);
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

export async function listIncidents(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listIncidents(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function listRollbacks(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = buildFilters(req);
    const data = await operatorAuditService.listRollbacks(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}
