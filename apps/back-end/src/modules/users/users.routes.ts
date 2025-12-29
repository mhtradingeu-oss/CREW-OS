import { Router } from "express";
import * as controller from "./users.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createUserSchema, updateUserSchema } from "./users.validators.js";

const router = Router();

router.get("/", requirePermission("users:read"), controller.list);
router.get("/:id", requirePermission("users:read"), controller.getById);
router.post(
  "/",
  requirePermission("users:create"),
  validateBody(createUserSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("users:update"),
  validateBody(updateUserSchema),
  controller.update,
);
router.delete("/:id", requirePermission("users:delete"), controller.remove);

export { router };
