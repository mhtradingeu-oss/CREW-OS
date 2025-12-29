import { Router } from "express";
import { list, markAllRead, markRead } from "./notification.controller.js";
import { requirePermission } from "../../core/security/rbac.js";

const router = Router();

router.get("/", requirePermission("notification:read"), list);
router.post("/read", requirePermission("notification:update"), markRead);
router.post("/read-all", requirePermission("notification:update"), markAllRead);

export { router };
