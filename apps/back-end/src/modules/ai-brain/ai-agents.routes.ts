import { Router } from "express";
import * as controller from "./ai-agents.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createAgentSchema, updateAgentSchema, runAgentSchema } from "./ai-agents.validators.js";

const router = Router();

router.get("/", requirePermission("ai:read"), controller.list);
router.get("/:id", requirePermission("ai:read"), controller.getById);
router.post("/run", requirePermission(["ai:run"]), validateBody(runAgentSchema), controller.run);
router.post(
  "/",
  requirePermission("ai:manage"),
  validateBody(createAgentSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("ai:manage"),
  validateBody(updateAgentSchema),
  controller.update,
);
router.delete("/:id", requirePermission("ai:manage"), controller.remove);
router.post("/:id/test", requirePermission(["ai:run", "ai:manage"]), controller.test);

export { router };
