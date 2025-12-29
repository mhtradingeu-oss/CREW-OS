import { Router } from "express";
import { authenticateRequest } from "../../core/security/auth-middleware.js";
import { requirePermission } from "../../core/security/rbac.js";
import { listHandler } from "./plan-history.controller.js";

const router = Router();

router.use(authenticateRequest, requirePermission("auth:me"));
router.get("/", listHandler);

export default router;
