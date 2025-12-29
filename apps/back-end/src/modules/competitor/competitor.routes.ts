import { Router } from "express";
import {
  getCompetitorPricesHandler,
  scanCompetitorsHandler,
} from "./competitor.controller.js";
import { requirePermission } from "../../core/security/rbac.js";

const router = Router();

router.post("/scan", requirePermission("competitor:scan"), scanCompetitorsHandler);
router.get("/prices", requirePermission("competitor:read"), getCompetitorPricesHandler);

export { router };
