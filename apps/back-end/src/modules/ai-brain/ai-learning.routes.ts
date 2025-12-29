import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./ai-brain.controller.js";
import { createLearningSchema } from "./ai-brain.validators.js";

const router = Router();

router.get("/", requirePermission(["ai:insights", "ai-brain:read"]), controller.listLearning);
router.post(
  "/",
  requirePermission(["ai:insights", "ai-brain:read"]),
  validateBody(createLearningSchema),
  controller.createLearning,
);

export { router };
