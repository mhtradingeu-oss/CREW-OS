import type { Request, Response, NextFunction } from "express";
import { forbidden } from "../../core/http/errors.js";
import { publishActivity } from "../../core/activity/activity.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { requireParam } from "../../core/http/params.js";
import { platformOpsService } from "./platform-ops.service.js";
import {
  listPlatformOpsAuditSchema,
  listPlatformOpsErrorSchema,
  listPlatformOpsJobsSchema,
  roleAssignmentSchema,
  superAdminUserListSchema,
} from "./platform-ops.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function getHealth(_req: Request, res: Response, next: NextFunction) {
  try {
    const health = await platformOpsService.getHealth();
    respondWithSuccess(res, health);
  } catch (err) {
    next(err);
  }
}

export async function listErrors(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listPlatformOpsErrorSchema.parse(req.query);
    const data = await platformOpsService.listErrors(parsed);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listJobs(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listPlatformOpsJobsSchema.parse(req.query);
    const data = await platformOpsService.listJobs(parsed.status);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listSecurity(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await platformOpsService.listSecurity();
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listAudit(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listPlatformOpsAuditSchema.parse(req.query);
    const data = await platformOpsService.listAudit(parsed);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function getSuperAdminHealth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertSuperAdmin(req);
    const health = await platformOpsService.getHealth();
    respondWithSuccess(res, health);
  } catch (err) {
    next(err);
  }
}

export async function listTenantsOverview(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertSuperAdmin(req);
    const data = await platformOpsService.getTenantOverview();
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function listUsersWithRBAC(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertSuperAdmin(req);
    const parsed = superAdminUserListSchema.parse(req.query);
    const data = await platformOpsService.listUsersWithRBAC(parsed);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

export async function assignUserRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertSuperAdmin(req);
    const userId = requireParam(req.params.userId, "userId");
    const body = roleAssignmentSchema.parse(req.body);
    const result = await platformOpsService.assignRoleToUser(userId, body, req.user?.id);
    await publishActivity(
      "platform-ops",
      "rbac_assigned",
      {
        entityType: "user-role",
        entityId: userId,
        metadata: { roleId: body.roleId, roleName: body.roleName, makePrimary: body.makePrimary, actorId: req.user?.id },
      },
      {
        actorUserId: req.user?.id,
        role: req.user?.role,
        tenantId: req.user?.tenantId,
        brandId: req.user?.brandId,
        source: "api",
      },
    );
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function removeUserRole(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    assertSuperAdmin(req);
    const userId = requireParam(req.params.userId, "userId");
    const body = roleAssignmentSchema.parse(req.body);
    const result = await platformOpsService.removeRoleFromUser(userId, body, req.user?.id);
    await publishActivity(
      "platform-ops",
      "rbac_removed",
      {
        entityType: "user-role",
        entityId: userId,
        metadata: { roleId: body.roleId, roleName: body.roleName, makePrimary: body.makePrimary, actorId: req.user?.id },
      },
      {
        actorUserId: req.user?.id,
        role: req.user?.role,
        tenantId: req.user?.tenantId,
        brandId: req.user?.brandId,
        source: "api",
      },
    );
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getPlanContext(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const tenantId = req.user?.tenantId ?? req.planContext?.tenantId;
    const brandId = req.user?.brandId ?? req.planContext?.brandId;
    const context = req.planContext ?? (await platformOpsService.getPlanContext(tenantId, brandId));
    respondWithSuccess(res, context);
  } catch (err) {
    next(err);
  }
}

export async function getPlanFeatures(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const tenantId = req.user?.tenantId ?? req.planContext?.tenantId;
    const brandId = req.user?.brandId ?? req.planContext?.brandId;
    const context = req.planContext ?? (await platformOpsService.getPlanContext(tenantId, brandId));
    const payload = await platformOpsService.getPlanFeatures(context);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

function assertSuperAdmin(req: AuthenticatedRequest) {
  if (req.user?.role !== "SUPER_ADMIN") {
    throw forbidden("SuperAdmin access required");
  }
}
