import { Router } from "express";
import { authenticateRequest } from "../../core/security/auth-middleware.js";
import { listSuggestions, approveSuggestion, rejectSuggestion, executeSuggestion } from "./ai-suggestion.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { executeAiSuggestionRequestSchema } from "./ai-suggestion.execution.validators.js";

const router = Router();

router.use(authenticateRequest);


router.post(
	"/:id/execute",
	requirePermission("ai-suggestion:execute"),
	validateBody(executeAiSuggestionRequestSchema),
	executeSuggestion,
);

router.get("/", listSuggestions);
router.post("/:id/approve", approveSuggestion);
router.post("/:id/reject", rejectSuggestion);

export default router;
