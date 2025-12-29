import { Router } from "express";
import * as controller from "./knowledge-base.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createKnowledgeDocumentSchema,
  updateKnowledgeDocumentSchema,
  knowledgeBaseSummarySchema,
  knowledgeBaseAttachSchema,
  knowledgeBaseQaSchema,
} from "./knowledge-base.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get("/", requirePermission("knowledge-base:read"), controller.list);
router.get("/:id", requirePermission("knowledge-base:read"), controller.getById);
router.post(
  "/",
  requirePermission("knowledge-base:create"),
  validateBody(createKnowledgeDocumentSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("knowledge-base:update"),
  validateBody(updateKnowledgeDocumentSchema),
  controller.update,
);
router.delete("/:id", requirePermission("knowledge-base:delete"), controller.remove);
router.post(
  "/:id/ai/summary",
  requirePermission(["knowledge-base:summarize", "knowledge-base:update"]),
  validateBody(knowledgeBaseSummarySchema),
  controller.aiSummary,
);
router.post(
  "/:id/ai/qa",
  requirePermission(["knowledge-base:summarize", "knowledge-base:update"]),
  requireFeature("operations"),
  validateBody(knowledgeBaseQaSchema),
  controller.aiQa,
);
router.post(
  "/:id/attach-file",
  requirePermission(["knowledge-base:update", "knowledge-base:summarize"]),
  validateBody(knowledgeBaseAttachSchema),
  controller.attachFile,
);

export { router };
