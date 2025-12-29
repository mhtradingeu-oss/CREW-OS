import { Router } from "express";
import { list } from "./activity-log.controller.js";
import { requirePermission } from "../../core/security/rbac.js";

const router = Router();

router.get("/", requirePermission("activity:read"), list);

export { router };
