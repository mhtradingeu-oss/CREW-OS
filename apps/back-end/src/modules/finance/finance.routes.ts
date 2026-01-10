import { Router } from "express";
import * as controller from "./finance.controller.js";
import * as einvoiceController from "./einvoice.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requirePlan } from "../../core/http/middleware/entitlements.js";
import { FEATURES } from "../../core/security/feature-registry.js";
import {
  createExpenseSchema,
  createFinanceSchema,
  createInvoiceSchema,
  financeRunwaySchema,
  updateFinanceSchema,
  updateInvoiceStatusSchema,
} from "./finance.validators.js";
import {
  generateEInvoiceSchema,
  validateEInvoiceSchema,
  sendEInvoiceSchema,
} from "./einvoice.validators.js";

const router = Router();

router.get("/", requirePermission("finance:read"), controller.list);
router.post(
  "/einvoice/generate",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:manage"),
  validateBody(generateEInvoiceSchema),
  einvoiceController.generate,
);
router.post(
  "/einvoice/validate",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:manage"),
  validateBody(validateEInvoiceSchema),
  einvoiceController.validate,
);
router.post(
  "/einvoice/send",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:manage"),
  validateBody(sendEInvoiceSchema),
  einvoiceController.send,
);
router.get(
  "/einvoice/:invoiceId",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:read"),
  einvoiceController.getByInvoice,
);
router.get("/:id", requirePermission("finance:read"), controller.getById);
router.post(
  "/",
  requirePermission("finance:create"),
  validateBody(createFinanceSchema),
  controller.create,
);
router.put(
  "/:id",
  requirePermission("finance:update"),
  validateBody(updateFinanceSchema),
  controller.update,
);
router.delete("/:id", requirePermission("finance:delete"), controller.remove);

router.post(
  "/ai/runway",
  requirePermission("finance:read"),
  validateBody(financeRunwaySchema),
  controller.runwaySummary,
);

router.get("/expenses", requirePermission("finance:read"), controller.listExpenses);
router.post(
  "/expenses",
  requirePermission("finance:manage"),
  validateBody(createExpenseSchema),
  controller.createExpense,
);
router.get(
  "/invoices",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:read"),
  controller.listInvoices,
);
router.post(
  "/invoices",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:manage"),
  validateBody(createInvoiceSchema),
  controller.createInvoice,
);
router.post(
  "/invoices/:id/status",
  (req, res, next) => req.feature = FEATURES.FINANCE_INVOICING, // Attach feature for audit
  requirePlan(FEATURES.FINANCE_INVOICING),
  requirePermission("finance:manage"),
  validateBody(updateInvoiceStatusSchema),
  controller.updateInvoiceStatus,
);

export { router };
