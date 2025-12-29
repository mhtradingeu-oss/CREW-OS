import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./media-studio.controller.js";
import {
  imageGenerationSchema,
  videoGenerationSchema,
  whiteLabelBatchSchema,
  whiteLabelPreviewSchema,
  whiteLabelProductMockupSchema,
  mediaIdeasSchema,
} from "./media-studio.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get("/engines/images", requirePermission(["ai:media:view", "ai:media:run"]), controller.listImageEngines);
router.get("/engines/videos", requirePermission(["ai:media:view", "ai:media:run"]), controller.listVideoEngines);

router.post(
  "/generate/image",
  requirePermission("ai:media:run"),
  validateBody(imageGenerationSchema),
  controller.generateImage,
);
router.post(
  "/generate/video",
  requirePermission("ai:media:run"),
  validateBody(videoGenerationSchema),
  controller.generateVideo,
);

router.post(
  "/white-label/preview",
  requirePermission("ai:white-label:run"),
  validateBody(whiteLabelPreviewSchema),
  controller.whiteLabelPreview,
);
router.post(
  "/white-label/batch",
  requirePermission("ai:white-label:run"),
  validateBody(whiteLabelBatchSchema),
  controller.whiteLabelBatch,
);
router.post(
  "/white-label/product-mockup",
  requirePermission("ai:white-label:run"),
  validateBody(whiteLabelProductMockupSchema),
  controller.whiteLabelProductMockup,
);

router.post(
  "/ai/ideas",
  requirePermission("ai:media:run"),
  requireFeature("mediaStudio"),
  validateBody(mediaIdeasSchema),
  controller.mediaIdeas,
);

export { router };
