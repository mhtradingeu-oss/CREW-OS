import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import {
  campaignLinkSchema,
  discoverSchema,
  negotiationSchema,
  recommendSchema,
} from "./influencer-os.validators.js";
import * as controller from "./influencer-os.controller.js";

const router = Router();

router.post(
  "/discover",
  requirePermission(["influencer:manage", "marketing:manage"]),
  requireFeature("influencerToolkit"),
  validateBody(discoverSchema),
  controller.discover,
);

router.get(
  "/scores",
  requirePermission(["influencer:read", "marketing:read"]),
  requireFeature("influencerToolkit"),
  controller.listScores,
);

router.post(
  "/recommend",
  requirePermission(["influencer:read", "influencer:manage", "marketing:manage"]),
  requireFeature("influencerToolkit"),
  validateBody(recommendSchema),
  controller.recommend,
);

router.post(
  "/negotiations",
  requirePermission(["influencer:manage"]),
  requireFeature("influencerToolkit"),
  validateBody(negotiationSchema),
  controller.createNegotiation,
);

router.get(
  "/negotiations",
  requirePermission(["influencer:read"]),
  requireFeature("influencerToolkit"),
  controller.listNegotiations,
);

router.post(
  "/campaign-links",
  requirePermission(["influencer:manage", "marketing:manage"]),
  requireFeature("influencerToolkit"),
  validateBody(campaignLinkSchema),
  controller.createCampaignLink,
);

router.get(
  "/campaign-links",
  requirePermission(["influencer:read", "marketing:read"]),
  requireFeature("influencerToolkit"),
  controller.listCampaignLinks,
);

export { router };
