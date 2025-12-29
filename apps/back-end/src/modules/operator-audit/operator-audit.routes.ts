import { Router } from "express";
import * as controller from "./operator-audit.controller.js";
import { requirePermission } from "../../core/security/rbac.js";

const router = Router();

router.get("/snapshots", requirePermission("audit:read"), controller.listSnapshots);
router.get("/suggestions", requirePermission("audit:read"), controller.listSuggestions);
router.get("/approvals", requirePermission("ai:approvals:read"), controller.listApprovals);
router.get("/approvals/:id", requirePermission("ai:approvals:read"), controller.getApprovalDetail);
router.get("/executions", requirePermission("automation:read"), controller.listExecutions);
router.get("/executions/:id", requirePermission("automation:read"), controller.getExecutionDetail);
router.get("/incidents", requirePermission("incident:read"), controller.listIncidents);
router.get("/rollbacks", requirePermission("incident:read"), controller.listRollbacks);

export { router };
