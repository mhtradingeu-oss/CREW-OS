import { Router } from "express";
import * as controller from "./partners.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import {
  createPartnerSchema,
  createPartnerUserSchema,
  createPartnerContractSchema,
  updatePartnerContractSchema,
  updatePartnerSchema,
  updatePartnerUserSchema,
  upsertPartnerPricingSchema,
  partnerAiInsightSchema,
} from "./partners.validators.js";

const router = Router();

// Permission: partners:read
router.get("/", requirePermission("partners:read"), controller.list);
// Permission: partners:read
router.get("/:id", requirePermission("partners:read"), controller.getById);
// Permission: partners:read
router.get("/:id/stats", requirePermission("partners:read"), controller.stats);

// Permission: partners:read
router.get(
  "/:id/contracts",
  requirePermission("partners:read"),
  controller.listContracts,
);
// Permission: partners:read
router.get(
  "/:id/contracts/:contractId",
  requirePermission("partners:read"),
  controller.getContract,
);
// Permission: partners:update
router.post(
  "/:id/contracts",
  requirePermission("partners:update"),
  validateBody(createPartnerContractSchema),
  controller.createContract,
);
// Permission: partners:update
router.patch(
  "/:id/contracts/:contractId",
  requirePermission("partners:update"),
  validateBody(updatePartnerContractSchema),
  controller.updateContract,
);
// Permission: partners:delete
router.delete(
  "/:id/contracts/:contractId",
  requirePermission("partners:delete"),
  controller.removeContract,
);

// Permission: partners:read
router.get("/:id/pricing", requirePermission("partners:read"), controller.listPricing);
// Permission: partners:update
router.post(
  "/:id/pricing/upsert",
  requirePermission("partners:update"),
  validateBody(upsertPartnerPricingSchema),
  controller.upsertPricing,
);

// Permission: partners:create
router.post(
  "/",
  requirePermission("partners:create"),
  validateBody(createPartnerSchema),
  controller.create,
);
// Permission: partners:update
router.put(
  "/:id",
  requirePermission("partners:update"),
  validateBody(updatePartnerSchema),
  controller.update,
);
// Permission: partners:delete
router.delete("/:id", requirePermission("partners:delete"), controller.remove);

// Permission: partners:read
router.get("/:id/users", requirePermission("partners:read"), controller.listUsers);
// Permission: partners:update
router.post(
  "/:id/users",
  requirePermission("partners:update"),
  validateBody(createPartnerUserSchema),
  controller.createUser,
);
// Permission: partners:update
router.patch(
  "/:id/users/:userId",
  requirePermission("partners:update"),
  validateBody(updatePartnerUserSchema),
  controller.updateUser,
);
// Permission: partners:delete
router.delete(
  "/:id/users/:userId",
  requirePermission("partners:delete"),
  controller.deactivateUser,
);

// Permission: partners:read
router.post(
  "/ai/insights",
  requirePermission("partners:read"),
  requireFeature("partner"),
  validateBody(partnerAiInsightSchema),
  controller.aiInsights,
);

export { router };
