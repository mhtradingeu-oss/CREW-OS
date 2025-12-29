import { Router } from "express";
import * as controller from "./product.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  createProductSchema,
  productImportSchema,
  productInsightSchema,
  productMediaSchema,
  updateProductSchema,
} from "./product.validators.js";

const router = Router();

 router.get("/", requirePermission("product:read"), controller.list);
 router.get("/export", requirePermission("product:export"), controller.exportProducts);
 router.get("/:id", requirePermission("product:read"), controller.getById);
 router.get(
  "/:id/ai/insight",
  requirePermission(["ai:insights", "product:read"]),
  controller.getInsight,
);
router.post(
  "/",
  requirePermission("product:create"),
  validateBody(createProductSchema),
  controller.create,
);
router.post(
  "/import",
  requirePermission("product:import"),
  validateBody(productImportSchema),
  controller.importProducts,
);
router.put(
  "/:id",
  requirePermission("product:update"),
  validateBody(updateProductSchema),
  controller.update,
);
router.delete("/:id", requirePermission("product:delete"), controller.remove);

router.post(
  "/:id/ai/insight",
  requirePermission(["ai:insights", "product:update"]),
  validateBody(productInsightSchema),
  controller.createInsight,
);
router.post(
  "/:id/media/attach",
  requirePermission("product:update"),
  validateBody(productMediaSchema),
  controller.attachMedia,
);
router.post(
  "/:id/media/detach",
  requirePermission("product:update"),
  validateBody(productMediaSchema),
  controller.detachMedia,
);

export { router };
