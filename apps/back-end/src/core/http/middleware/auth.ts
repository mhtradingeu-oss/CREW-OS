import type { Response, NextFunction } from "express";
import { requirePermission, type AuthenticatedRequest } from "../../security/rbac.js";

export function authGuard(requiredPermissions?: string[]) {
  if (!requiredPermissions || !requiredPermissions.length) {
    return (_req: AuthenticatedRequest, _res: Response, next: NextFunction) => next();
  }
  const middleware = requirePermission(requiredPermissions);
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => middleware(req, res, next);
}
