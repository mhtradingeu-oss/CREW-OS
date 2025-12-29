import { Router } from "express";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import * as controller from "./stand-pos.controller.js";
import {
  createRefillSchema,
  createStandSchema,
  standAiStockSchema,
  updateStandSchema,
} from "./stand-pos.validators.js";

const router = Router();

router.get("/stands", requirePermission("pos:read"), controller.list);
router.get("/stands/:id", requirePermission("pos:read"), controller.getById);
router.post(
  "/stands",
  requirePermission("pos:manage"),
  validateBody(createStandSchema),
  controller.create,
);
router.put(
  "/stands/:id",
  requirePermission("pos:manage"),
  validateBody(updateStandSchema),
  controller.update,
);
router.get("/stands/:id/inventory", requirePermission("pos:read"), controller.getInventory);
router.post(
  "/stands/:id/refills",
  requirePermission("pos:manage"),
  validateBody(createRefillSchema),
  controller.createRefill,
);
router.post(
  "/stands/:id/ai/stock",
  requirePermission(["ai:pricing", "pos:read"]),
  validateBody(standAiStockSchema),
  controller.getAiStockSuggestion,
);
router.get("/stands/:id/performance", requirePermission("pos:read"), controller.getPerformance);
router.get("/stands/kpi", requirePermission("pos:stats"), controller.listKpis);
router.get("/stands/:id/kpi", requirePermission("pos:stats"), controller.getKpi);
router.post(
  "/stands/:id/kpi/recalculate",
  requirePermission("pos:manage"),
  controller.recalculateKpi,
);
router.get(
  "/stands/:id/insights",
  requirePermission(["pos:read", "ai:insights"]),
  controller.getInsights,
);

export { router };
