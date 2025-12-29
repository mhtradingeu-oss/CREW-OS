import { Router } from "express";
import * as controller from "./admin.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { aiRestrictionSchema, aiSummarySchema, policySchema } from "./admin.validators.js";

const router = Router();

router.get("/policies", requirePermission("security:policies:read"), controller.listPolicies);
router.get("/policies/:id", requirePermission("security:policies:read"), controller.getPolicy);
router.post(
  "/policies",
  requirePermission("security:policies:manage"),
  validateBody(policySchema),
  controller.createPolicy,
);
router.put(
  "/policies/:id",
  requirePermission("security:policies:manage"),
  validateBody(policySchema.partial()),
  controller.updatePolicy,
);
router.delete("/policies/:id", requirePermission("security:policies:manage"), controller.deletePolicy);

router.get(
  "/ai-restrictions",
  requirePermission("admin:read"),
  controller.listAIRestrictions,
);
router.post(
  "/ai-restrictions",
  requirePermission("admin:create"),
  validateBody(aiRestrictionSchema),
  controller.createAIRestriction,
);
router.put(
  "/ai-restrictions/:id",
  requirePermission("admin:update"),
  validateBody(aiRestrictionSchema.partial()),
  controller.updateAIRestriction,
);
router.delete(
  "/ai-restrictions/:id",
  requirePermission("admin:delete"),
  controller.deleteAIRestriction,
);

router.get("/audit-logs", requirePermission("admin:read"), controller.listAuditLogs);
router.post(
  "/ai/audit-summary",
  requirePermission(["ai:insights", "admin:read"]),
  validateBody(aiSummarySchema),
  controller.aiAuditSummary,
);

router.get(
  "/ai/telemetry",
  requirePermission("admin:read"),
  controller.listAITelemetry,
);

export { router };
