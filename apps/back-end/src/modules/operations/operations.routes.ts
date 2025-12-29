import { Router } from "express";
import * as controller from "./operations.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createTaskSchema, updateTaskSchema, completeTaskSchema } from "./operations.validators.js";

const router = Router();

router.get(
  "/tasks",
  requirePermission("operations:read"),
  controller.listTasks,
);
router.post(
  "/tasks",
  requirePermission("operations:create"),
  validateBody(createTaskSchema),
  controller.createTask,
);
router.patch(
  "/tasks/:id",
  requirePermission("operations:update"),
  validateBody(updateTaskSchema),
  controller.updateTask,
);
router.post(
  "/tasks/:id/complete",
  requirePermission("operations:update"),
  validateBody(completeTaskSchema),
  controller.completeTask,
);
router.get(
  "/activity",
  requirePermission("operations:read"),
  controller.listActivityLogs,
);

export { router };
