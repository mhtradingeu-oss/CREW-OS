import { Router } from "express";
import { authenticateRequest } from "../../core/security/auth-middleware.js";
import { listSuggestions, approveSuggestion, rejectSuggestion, executeSuggestion } from "./ai-suggestion.controller.js";
import { requirePermission } from "../../core/security/rbac.js";

const router = Router();

router.use(authenticateRequest);


router.post(
	"/:id/execute",
	requirePermission("ai-suggestion:execute"),
	executeSuggestion
);

router.get("/", listSuggestions);
router.post("/:id/approve", approveSuggestion);
router.post("/:id/reject", rejectSuggestion);

export default router;
