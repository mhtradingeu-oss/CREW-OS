import { Router } from "express";
import * as controller from "./sales-reps.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createLeadSchema,
  createSalesRepsSchema,
  createVisitSchema,
  salesRepAiPlanSchema,
  updateSalesRepsSchema,
} from "./sales-reps.validators.js";
import { createSalesOrderSchema } from "./sales-reps.validators.js";

const router = Router();

// Special route: place sales order with pricing + inventory guard
router.post(
  "/order",
  requirePermission("sales-rep:manage"),
  validateBody(createSalesOrderSchema),
  controller.createSalesOrderWithPricingAndInventory,
);

router.get("/", requirePermission("sales-rep:read"), controller.list);
router.get("/:id", requirePermission("sales-rep:read"), controller.getById);
router.post(
  "/",
  requirePermission("sales-rep:manage"),
  validateBody(createSalesRepsSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("sales-rep:manage"),
  validateBody(updateSalesRepsSchema),
  controller.update,
);
router.get("/:id/leads", requirePermission("sales-rep:read"), controller.listLeads);
router.post(
  "/:id/leads",
  requirePermission("sales-rep:manage"),
  validateBody(createLeadSchema),
  controller.createLead,
);
router.get("/:id/visits", requirePermission("sales-rep:read"), controller.listVisits);
router.post(
  "/:id/visits",
  requirePermission("sales-rep:manage"),
  validateBody(createVisitSchema),
  controller.createVisit,
);
router.get("/:id/kpis", requirePermission("sales-rep:kpi"), controller.getKpis);
router.post(
  "/:id/ai/prioritize",
  requirePermission(["ai:crm", "sales-rep:kpi"]),
  validateBody(salesRepAiPlanSchema),
  controller.getAiPlan,
);

export { router };
