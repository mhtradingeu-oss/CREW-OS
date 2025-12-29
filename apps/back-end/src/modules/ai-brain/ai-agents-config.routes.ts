import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./ai-agents-config.controller.js";
import { updateAgentConfigSchema } from "./ai-agents-config.validators.js";

const router = Router();

router.get("/", requirePermission("ai:config:read"), controller.list);
router.get("/:agentId", requirePermission("ai:config:read"), controller.getById);
router.post(
  "/:agentId",
  requirePermission("ai:config:update"),
  validateBody(updateAgentConfigSchema),
  controller.update,
);

export { router };
