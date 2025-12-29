import { Router } from "express";
import * as controller from "./communication.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createCommunicationSchema,
  sendMessageSchema,
  updateCommunicationSchema,
} from "./communication.validators.js";

const router = Router();

router.get("/", requirePermission("communication:read"), controller.list);
router.get("/:id", requirePermission("communication:read"), controller.getById);
router.post(
  "/",
  requirePermission("communication:create"),
  validateBody(createCommunicationSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("communication:update"),
  validateBody(updateCommunicationSchema),
  controller.update,
);
router.delete("/:id", requirePermission("communication:delete"), controller.remove);

router.post(
  "/send",
  requirePermission("communication:send"),
  validateBody(sendMessageSchema),
  controller.sendMessage,
);

export { router };
