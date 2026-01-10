import type { Request, Response, NextFunction } from "express";
import { requirePermission } from "../../security/rbac.js";

export function authGuard(requiredPermissions?: string[]) {
  if (!requiredPermissions || !requiredPermissions.length) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  const middleware = requirePermission(requiredPermissions);
  return (req: Request, res: Response, next: NextFunction) => middleware(req, res, next);
}
