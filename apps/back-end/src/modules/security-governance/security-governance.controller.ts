import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { forbidden } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { security_governanceService } from "./security-governance.service.js";
import {
  assignRoleSchema,
  createAiRestrictionSchema,
  createRoleSchema,
  listSecurityPoliciesSchema,
  setRolePermissionsSchema,
  updateAiRestrictionSchema,
  updateRoleSchema,
} from "./security-governance.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const filters = listSecurityPoliciesSchema.parse(req.query);
    const items = await security_governanceService.list(filters, req.user);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.getById(id, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const item = await security_governanceService.create(req.body, req.user);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.update(id, req.body, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await security_governanceService.remove(id, req.user);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function rbacOverview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (req.user?.role !== "SUPER_ADMIN") {
      throw forbidden("SUPER_ADMIN access required");
    }
    const overview = await security_governanceService.rbacOverview();
    respondWithSuccess(res, overview);
  } catch (err) {
    next(err);
  }
}

export async function listRoles(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const roles = await security_governanceService.listRoles();
    respondWithSuccess(res, roles);
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createRoleSchema.parse(req.body);
    const role = await security_governanceService.createRole(payload, req.user);
    respondWithSuccess(res, role, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = updateRoleSchema.parse(req.body);
    const role = await security_governanceService.updateRole(id, payload, req.user);
    respondWithSuccess(res, role);
  } catch (err) {
    next(err);
  }
}

export async function setRolePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = setRolePermissionsSchema.parse(req.body);
    const role = await security_governanceService.setRolePermissions(id, payload.permissions, req.user);
    respondWithSuccess(res, role);
  } catch (err) {
    next(err);
  }
}

export async function listPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const items = await security_governanceService.listPermissions();
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function assignRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = assignRoleSchema.parse(req.body);
    const result = await security_governanceService.assignRoleToUser(payload, req.user);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function revokeRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = assignRoleSchema.pick({ userId: true, role: true }).parse(req.body);
    const result = await security_governanceService.revokeRoleFromUser(payload, req.user);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listAiRestrictions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const items = await security_governanceService.listAiRestrictions();
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getAiRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.getAiRestriction(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createAiRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = createAiRestrictionSchema.parse(req.body);
    const item = await security_governanceService.upsertAiRestriction(null, payload, req.user);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAiRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = updateAiRestrictionSchema.parse(req.body);
    const item = await security_governanceService.upsertAiRestriction(id, payload, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteAiRestriction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await security_governanceService.deleteAiRestriction(id, req.user);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
