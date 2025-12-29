import { Router } from "express";
import * as controller from "./affiliate.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createAffiliateSchema, updateAffiliateSchema } from "./affiliate.validators.js";

const router = Router();

router.post("/conversions", requirePermission("affiliate:create"), controller.createConversion);
router.post("/payouts/request", requirePermission("affiliate:update"), controller.requestPayout);
router.post("/payouts/:id/approve", requirePermission("affiliate:update"), controller.approvePayout);
router.post("/payouts/:id/reject", requirePermission("affiliate:update"), controller.rejectPayout);
router.post("/payouts/:id/paid", requirePermission("affiliate:update"), controller.markPayoutPaid);
router.get(
  "/dashboard/summary",
  requirePermission("affiliate:read"),
  controller.dashboardSummary,
);

router.get("/", requirePermission("affiliate:read"), controller.list);
router.get("/:id", requirePermission("affiliate:read"), controller.getById);
router.post(
  "/",
  requirePermission("affiliate:create"),
  validateBody(createAffiliateSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("affiliate:update"),
  validateBody(updateAffiliateSchema),
  controller.update,
);
router.delete("/:id", requirePermission("affiliate:delete"), controller.remove);

export { router };
