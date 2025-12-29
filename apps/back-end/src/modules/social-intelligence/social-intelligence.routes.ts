import { Router } from "express";
import * as controller from "./social-intelligence.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import {
  aiSummarySchema,
  influencerSchema,
  listCompetitorReportsSchema,
  listInfluencersSchema,
  listMentionsSchema,
  listTrendsSchema,
  trendSchema,
} from "./social-intelligence.validators.js";

const router = Router();

router.get("/mentions", requirePermission("social-intelligence:read"), controller.listMentions);
router.get("/mentions/:id", requirePermission("social-intelligence:read"), controller.getMention);

router.get(
  "/influencers",
  requirePermission("social-intelligence:read"),
  controller.listInfluencers,
);
router.post(
  "/influencers",
  requirePermission("social-intelligence:create"),
  validateBody(influencerSchema),
  controller.createInfluencer,
);
router.put(
  "/influencers/:id",
  requirePermission("social-intelligence:update"),
  validateBody(influencerSchema.partial()),
  controller.updateInfluencer,
);
router.delete(
  "/influencers/:id",
  requirePermission("social-intelligence:delete"),
  controller.deleteInfluencer,
);

router.get("/trends", requirePermission("social-intelligence:read"), controller.listTrends);
router.post(
  "/trends",
  requirePermission("social-intelligence:create"),
  validateBody(trendSchema),
  controller.createTrend,
);
router.put(
  "/trends/:id",
  requirePermission("social-intelligence:update"),
  validateBody(trendSchema.partial()),
  controller.updateTrend,
);
router.delete(
  "/trends/:id",
  requirePermission("social-intelligence:delete"),
  controller.deleteTrend,
);

router.get(
  "/competitor-reports",
  requirePermission("social-intelligence:read"),
  controller.listCompetitorReports,
);

router.get("/ai/insight", requirePermission("social-intelligence:read"), controller.getInsight);
router.post(
  "/ai/summary",
  requirePermission(["ai:social-intelligence", "social-intelligence:update"]),
  validateBody(aiSummarySchema),
  controller.aiSummary,
);

export { router };
