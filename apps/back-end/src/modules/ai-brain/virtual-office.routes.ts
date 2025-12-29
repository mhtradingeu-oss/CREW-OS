import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  startMeeting,
  listDepartments,
  listActionItems,
} from "./virtual-office.controller.js";
import { virtualOfficeMeetingSchema } from "./virtual-office.validators.js";

const router = Router();

router.get("/departments", requirePermission("ai:read"), listDepartments);
router.post(
  "/meeting",
  requirePermission(["ai:virtual-office", "ai:run"]),
  validateBody(virtualOfficeMeetingSchema),
  startMeeting,
);

router.get("/action-items", requirePermission("ai:read"), listActionItems);

export { router };
