import { Router } from "express";
import { validateBody } from "../../core/http/middleware/validate.js";
import { authenticateRequest } from "../../core/security/auth-middleware.js";
import { requirePermission } from "../../core/security/rbac.js";
import { startHandler, personaHandler, planHandler, optionsHandler } from "./onboarding.controller.js";
import { personaSchema, planSelectionSchema } from "./onboarding.validators.js";

const router = Router();

router.use(authenticateRequest, requirePermission("auth:me"));
router.post("/start", startHandler);
router.post("/persona", validateBody(personaSchema), personaHandler);
router.patch("/plan", validateBody(planSelectionSchema), planHandler);
router.get("/options", optionsHandler);

export default router;
