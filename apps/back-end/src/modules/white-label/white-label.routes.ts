import { Router } from "express";
import * as controller from "./white-label.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createBrandSchema,
  createOrderSchema,
  createProductSchema,
  pricingSyncSchema,
  updateBrandSchema,
  updateOrderStatusSchema,
} from "./white-label.validators.js";

const router = Router();

router.get("/brands", requirePermission("white-label:read"), controller.listBrands);
router.get("/brands/:id", requirePermission("white-label:read"), controller.getBrand);
router.post(
  "/brands",
  requirePermission("white-label:create"),
  validateBody(createBrandSchema),
  controller.createBrand,
);
router.patch(
  "/brands/:id",
  requirePermission("white-label:update"),
  validateBody(updateBrandSchema),
  controller.updateBrand,
);
router.get("/brands/:id/stats", requirePermission("white-label:read"), controller.getStats);
router.get("/brands/:id/products", requirePermission("white-label:read"), controller.listProducts);
router.post(
  "/brands/:id/products",
  requirePermission("white-label:create"),
  validateBody(createProductSchema),
  controller.createProduct,
);
router.post(
  "/brands/:id/orders",
  requirePermission("white-label:manage"),
  validateBody(createOrderSchema),
  controller.createOrder,
);
router.patch(
  "/orders/:id/status",
  requirePermission("white-label:manage"),
  validateBody(updateOrderStatusSchema),
  controller.updateOrderStatus,
);
router.post(
  "/pricing/sync",
  requirePermission("white-label:manage"),
  validateBody(pricingSyncSchema),
  controller.requestPricingSync,
);

export { router };
