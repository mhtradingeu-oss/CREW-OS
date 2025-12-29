import { Router } from "express";
import { requirePermission } from "../../../core/security/rbac.js";
import * as controller from "./ai-suggestions.controller.js";

const router = Router();

router.get("/", requirePermission(["ai:read", "ai:suggestions:read"]), controller.getSuggestions);

export { router };
