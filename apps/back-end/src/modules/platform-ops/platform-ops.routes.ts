import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import {
  getHealth,
  assignUserRole,
  listAudit,
  listErrors,
  listJobs,
  listSecurity,
  getSuperAdminHealth,
  listTenantsOverview,
  listUsersWithRBAC,
  removeUserRole,
  getPlanContext,
  getPlanFeatures,
} from "./platform-ops.controller.js";

const router = Router();

router.get("/health", requirePermission("ops:health"), getHealth);
router.get("/errors", requirePermission("ops:errors"), listErrors);
router.get("/jobs", requirePermission("ops:jobs"), listJobs);
router.get("/security", requirePermission("ops:security"), listSecurity);
router.get("/audit", requirePermission("ops:audit"), listAudit);
router.get(
  "/superadmin/tenants/overview",
  requirePermission("superadmin:tenants:view"),
  listTenantsOverview,
);
router.get(
  "/superadmin/users",
  requirePermission("superadmin:users:read"),
  listUsersWithRBAC,
);
router.post(
  "/superadmin/users/:userId/roles/assign",
  requirePermission("superadmin:users:manage"),
  assignUserRole,
);
router.post(
  "/superadmin/users/:userId/roles/remove",
  requirePermission("superadmin:users:manage"),
  removeUserRole,
);
router.get(
  "/superadmin/platform/health",
  requirePermission("superadmin:platform:view"),
  getSuperAdminHealth,
);
router.get("/plans", requirePermission("ops:health"), getPlanContext);
router.get("/plans/features", requirePermission("ops:health"), getPlanFeatures);

export { router };
