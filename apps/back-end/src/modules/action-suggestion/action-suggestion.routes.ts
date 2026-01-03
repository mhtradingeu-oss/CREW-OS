// Routes for ActionSuggestion (read-only)
import { Router } from "express";
import { requireInternalAdmin } from "../../core/security/internal-auth-middleware.js";
import { validateQuery } from "../../core/http/middleware/validate.js";
import { getActionSuggestions } from "./action-suggestion.controller.js";
import { actionSuggestionQuerySchema } from "./action-suggestion.validators.js";

const router = Router();

// GET /actions under /internal/intelligence (read-only, internal only)
router.get(
  "/actions",
  requireInternalAdmin,
  validateQuery(actionSuggestionQuerySchema),
  getActionSuggestions,
);

export default router;
