import type { Request, Response, NextFunction } from "express";

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

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const filters = listSecurityPoliciesSchema.parse(req.query);
    const items = await security_governanceService.list(filters, req.user);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.getById(id, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await security_governanceService.create(req.body, req.user);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.update(id, req.body, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await security_governanceService.remove(id, req.user);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function rbacOverview(req: Request, res: Response, next: NextFunction) {
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

export async function listRoles(req: Request, res: Response, next: NextFunction) {
  try {
    const roles = await security_governanceService.listRoles();
    respondWithSuccess(res, roles);
  } catch (err) {
    next(err);
  }
}

export async function createRole(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createRoleSchema.parse(req.body);
    const role = await security_governanceService.createRole(payload, req.user);
    respondWithSuccess(res, role, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = updateRoleSchema.parse(req.body);
    const role = await security_governanceService.updateRole(id, payload, req.user);
    respondWithSuccess(res, role);
  } catch (err) {
    next(err);
  }
}

export async function setRolePermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = setRolePermissionsSchema.parse(req.body);
    const role = await security_governanceService.setRolePermissions(id, payload.permissions, req.user);
    respondWithSuccess(res, role);
  } catch (err) {
    next(err);
  }
}

export async function listPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await security_governanceService.listPermissions();
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function assignRole(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = assignRoleSchema.parse(req.body);
    const result = await security_governanceService.assignRoleToUser(payload, req.user);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function revokeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = assignRoleSchema.pick({ userId: true, role: true }).parse(req.body);
    const result = await security_governanceService.revokeRoleFromUser(payload, req.user);
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listAiRestrictions(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await security_governanceService.listAiRestrictions();
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getAiRestriction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await security_governanceService.getAiRestriction(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function createAiRestriction(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createAiRestrictionSchema.parse(req.body);
    const item = await security_governanceService.upsertAiRestriction(null, payload, req.user);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAiRestriction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = updateAiRestrictionSchema.parse(req.body);
    const item = await security_governanceService.upsertAiRestriction(id, payload, req.user);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteAiRestriction(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await security_governanceService.deleteAiRestriction(id, req.user);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}
