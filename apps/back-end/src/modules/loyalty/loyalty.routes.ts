import { Router } from "express";
import * as controller from "./loyalty.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { createLoyaltySchema, loyaltyAiInsightSchema, updateLoyaltySchema } from "./loyalty.validators.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";

const router = Router();

router.get("/programs", requirePermission("loyalty:read"), controller.listPrograms);
router.post("/programs", requirePermission("loyalty:create"), controller.createProgram);
router.get("/programs/:programId/tiers", requirePermission("loyalty:read"), controller.listProgramTiers);
router.post(
  "/programs/:programId/tiers",
  requirePermission("loyalty:create"),
  controller.createProgramTier,
);
router.get("/programs/:programId/rewards", requirePermission("loyalty:read"), controller.listProgramRewards);
router.post(
  "/programs/:programId/rewards",
  requirePermission("loyalty:create"),
  controller.createProgramReward,
);
router.post(
  "/rewards/:rewardId/redeem",
  requirePermission("loyalty:update"),
  controller.redeemReward,
);
router.get(
  "/dashboard/summary",
  requirePermission("loyalty:read"),
  controller.dashboardSummary,
);

router.post(
  "/ai/insights",
  requirePermission("loyalty:read"),
  requireFeature("loyalty"),
  validateBody(loyaltyAiInsightSchema),
  controller.aiInsights,
);

router.get("/", requirePermission("loyalty:read"), controller.list);
router.get("/:id", requirePermission("loyalty:read"), controller.getById);
router.post(
  "/",
  requirePermission("loyalty:create"),
  validateBody(createLoyaltySchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("loyalty:update"),
  validateBody(updateLoyaltySchema),
  controller.update,
);
router.delete("/:id", requirePermission("loyalty:delete"), controller.remove);

export { router };
