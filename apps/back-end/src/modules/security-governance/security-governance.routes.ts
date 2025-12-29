import { Router } from "express";
import * as controller from "./security-governance.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import {
  createSecurityGovernanceSchema,
  updateSecurityGovernanceSchema,
} from "./security-governance.validators.js";

const router = Router();

router.get(
  "/",
  requirePermission(["security:policies:read", "security-governance:read"]),
  controller.list,
);
router.get(
  "/policies",
  requirePermission(["security:policies:read", "security-governance:read"]),
  controller.list,
);
router.get(
  "/policies/:id",
  requirePermission(["security:policies:read", "security-governance:read"]),
  controller.getById,
);
router.get("/rbac/overview", requirePermission("security:rbac:view"), controller.rbacOverview);
router.get(
  "/:id",
  requirePermission(["security:policies:read", "security-governance:read"]),
  controller.getById,
);
router.post(
  "/policies",
  requirePermission(["security:policies:manage", "security-governance:create"]),
  requireFeature("governance"),
  validateBody(createSecurityGovernanceSchema),
  controller.create,
);
router.put(
  "/policies/:id",
  requirePermission(["security:policies:manage", "security-governance:update"]),
  requireFeature("governance"),
  validateBody(updateSecurityGovernanceSchema),
  controller.update,
);
router.delete(
  "/policies/:id",
  requirePermission(["security:policies:manage", "security-governance:delete"]),
  requireFeature("governance"),
  controller.remove,
);

// Roles & permissions
router.get("/rbac/roles", requirePermission("security:rbac:view"), controller.listRoles);
router.post(
  "/rbac/roles",
  requirePermission("security:rbac:manage"),
  requireFeature("governance"),
  controller.createRole,
);
router.put(
  "/rbac/roles/:id",
  requirePermission("security:rbac:manage"),
  requireFeature("governance"),
  controller.updateRole,
);
router.post(
  "/rbac/roles/:id/permissions",
  requirePermission("security:rbac:manage"),
  requireFeature("governance"),
  controller.setRolePermissions,
);
router.get("/rbac/permissions", requirePermission("security:rbac:view"), controller.listPermissions);
router.post(
  "/rbac/roles/assign",
  requirePermission("security:rbac:manage"),
  requireFeature("governance"),
  controller.assignRole,
);
router.post(
  "/rbac/roles/revoke",
  requirePermission("security:rbac:manage"),
  requireFeature("governance"),
  controller.revokeRole,
);

// AI restriction policies
router.get(
  "/ai/restrictions",
  requirePermission(["ai:manage", "security:policies:read"]),
  controller.listAiRestrictions,
);
router.get(
  "/ai/restrictions/:id",
  requirePermission(["ai:manage", "security:policies:read"]),
  controller.getAiRestriction,
);
router.post(
  "/ai/restrictions",
  requirePermission(["ai:manage", "security:policies:manage"]),
  requireFeature("aiInsights"),
  controller.createAiRestriction,
);
router.put(
  "/ai/restrictions/:id",
  requirePermission(["ai:manage", "security:policies:manage"]),
  requireFeature("aiInsights"),
  controller.updateAiRestriction,
);
router.delete(
  "/ai/restrictions/:id",
  requirePermission(["ai:manage", "security:policies:manage"]),
  requireFeature("aiInsights"),
  controller.deleteAiRestriction,
);

export { router };
