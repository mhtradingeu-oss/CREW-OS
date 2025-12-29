import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./white-label-configurator.controller.js";
import { whiteLabelBatchSchema, whiteLabelProductMockupSchema } from "./white-label-configurator.validators.js";

const router = Router();

router.post(
  "/preview",
  requirePermission("ai:white-label:run"),
  validateBody(whiteLabelProductMockupSchema),
  controller.preview,
);

router.post(
  "/batch",
  requirePermission("ai:white-label:run"),
  validateBody(whiteLabelBatchSchema),
  controller.batch,
);

export { router };
