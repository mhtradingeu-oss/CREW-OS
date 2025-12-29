import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { badRequest } from "../../core/http/errors.js";
import { activityLogService } from "./activity-log.service.js";
import { listActivityLogSchema } from "./activity-log.validators.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = listActivityLogSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const scopedBrandId = resolveScopedBrandId(
      { brandId: req.user?.brandId, role: req.user?.role },
      parsed.data.brandId,
    );
    const filters = { ...parsed.data, brandId: scopedBrandId };
    const result = await activityLogService.list(filters);
    respondWithSuccess(res, {
      items: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    });
  } catch (err) {
    next(err);
  }
}
