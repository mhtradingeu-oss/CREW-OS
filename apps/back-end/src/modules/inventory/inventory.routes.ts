import { Router } from "express";
import * as controller from "./inventory.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createInventoryItemSchema, inventoryAdjustmentSchema } from "./inventory.validators.js";

const router = Router();

router.get(
  "/insights",
  requirePermission("inventory:read"),
  controller.insights,
);

router.get("/", requirePermission("inventory:read"), controller.list);
router.get("/:id", requirePermission("inventory:read"), controller.getById);
router.post(
  "/",
  requirePermission("inventory:create"),
  validateBody(createInventoryItemSchema),
  controller.create,
);
router.post(
  "/adjustments",
  requirePermission(["inventory:update", "inventory:adjust"]),
  validateBody(inventoryAdjustmentSchema),
  controller.createAdjustment,
);

export { router };
