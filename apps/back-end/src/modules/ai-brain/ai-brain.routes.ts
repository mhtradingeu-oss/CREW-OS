import { Router } from "express";
import * as controller from "./ai-brain.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createAiBrainSchema, updateAiBrainSchema } from "./ai-brain.validators.js";
import { router as aiAgentsRouter } from "./ai-agents.routes.js";
import { router as aiInsightsRouter } from "./ai-insights.routes.js";
import { router as aiReportsRouter } from "./ai-reports.routes.js";
import { router as aiLearningRouter } from "./ai-learning.routes.js";
import { router as virtualOfficeRouter } from "./virtual-office.routes.js";
import { router as aiAutonomyRouter, autonomyDebugRouter } from "./ai-autonomy.routes.js";
import { router as aiAgentsConfigRouter } from "./ai-agents-config.routes.js";

const router = Router();

router.get("/", requirePermission("ai-brain:read"), controller.list);
router.get("/:id", requirePermission("ai-brain:read"), controller.getById);
router.post(
  "/",
  requirePermission("ai-brain:create"),
  validateBody(createAiBrainSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("ai-brain:update"),
  validateBody(updateAiBrainSchema),
  controller.update,
);
router.delete("/:id", requirePermission("ai-brain:delete"), controller.remove);
router.post("/assistant/chat", requirePermission(["ai:run"]), controller.assistantChat);

router.use("/agents/config", aiAgentsConfigRouter);
router.use("/agents", aiAgentsRouter);
router.use("/insights", aiInsightsRouter);
router.use("/reports", aiReportsRouter);
router.use("/learning", aiLearningRouter);
router.use("/virtual-office", virtualOfficeRouter);
router.use("/autonomy", aiAutonomyRouter);
router.use("/debug/autonomy", autonomyDebugRouter);

export { router };
