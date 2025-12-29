import { Router } from "express";
import * as controller from "./finance.controller.js";
import * as einvoiceController from "./einvoice.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
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
  requirePermission("finance:manage"),
  validateBody(generateEInvoiceSchema),
  einvoiceController.generate,
);
router.post(
  "/einvoice/validate",
  requirePermission("finance:manage"),
  validateBody(validateEInvoiceSchema),
  einvoiceController.validate,
);
router.post(
  "/einvoice/send",
  requirePermission("finance:manage"),
  validateBody(sendEInvoiceSchema),
  einvoiceController.send,
);
router.get(
  "/einvoice/:invoiceId",
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
router.get("/invoices", requirePermission("finance:read"), controller.listInvoices);
router.post(
  "/invoices",
  requirePermission("finance:manage"),
  validateBody(createInvoiceSchema),
  controller.createInvoice,
);
router.post(
  "/invoices/:id/status",
  requirePermission("finance:manage"),
  validateBody(updateInvoiceStatusSchema),
  controller.updateInvoiceStatus,
);

export { router };
