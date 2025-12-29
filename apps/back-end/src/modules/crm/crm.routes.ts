import { Router } from "express";
import * as controller from "./crm.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createCrmSchema,
  createSegmentSchema,
  convertLeadToContactSchema,
  convertLeadToCustomerSchema,
  crmFollowupSchema,
  crmScoreSchema,
  updateCrmSchema,
} from "./crm.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get("/", requirePermission("crm:read"), controller.list);
router.get("/:id", requirePermission("crm:read"), controller.getById);
router.post("/", requirePermission("crm:create"), validateBody(createCrmSchema), controller.create);
router.put(
  "/:id",
  requirePermission("crm:update"),
  validateBody(updateCrmSchema),
  controller.update,
);
router.post(
  "/:id/contact",
  requirePermission("crm:update"),
  validateBody(convertLeadToContactSchema),
  controller.convertToContact,
);
router.post(
  "/:id/customer",
  requirePermission("crm:update"),
  validateBody(convertLeadToCustomerSchema),
  controller.convertToCustomer,
);
router.delete("/:id", requirePermission("crm:delete"), controller.remove);
router.post(
  "/:id/ai/score",
  requirePermission(["ai:crm", "crm:update"]),
  requireFeature("crm"),
  validateBody(crmScoreSchema),
  controller.aiScore,
);
router.post(
  "/ai/followups",
  requirePermission(["ai:crm", "crm:update", "crm:read"]),
  requireFeature("crm"),
  validateBody(crmFollowupSchema),
  controller.aiFollowup,
);
router.get("/segments", requirePermission("crm:segments:read"), controller.listSegments);
router.post(
  "/segments",
  requirePermission("crm:segments:manage"),
  validateBody(createSegmentSchema),
  controller.createSegment,
);
router.get("/segments/:segmentId/leads", requirePermission("crm:segments:read"), controller.getSegmentLeads);

export { router };
