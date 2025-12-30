import { Router } from "express";
import { requirePermission } from "../../../core/security/rbac.js";
import * as controller from "./ai-read-only.controller.js";

const router = Router();

router.get("/snapshot", requirePermission(["ai:read", "ai:insights:read"]), controller.getSnapshot);

export { router as aiReadOnlyRouter };
