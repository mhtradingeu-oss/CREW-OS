import { Router } from "express";
import { requireInternalAdmin } from "../../core/security/internal-auth-middleware.js";
import { validateQuery } from "../../core/http/middleware/validate.js";
import * as controller from "./internal-intelligence.controller.js";
import { insightsQuerySchema, recommendationsQuerySchema } from "./internal-intelligence.validators.js";

const router = Router();

router.get(
  "/insights",
  requireInternalAdmin,
  validateQuery(insightsQuerySchema),
  controller.getInsights,
);

router.get(
  "/recommendations",
  requireInternalAdmin,
  validateQuery(recommendationsQuerySchema),
  controller.getRecommendations,
);

export { router };
