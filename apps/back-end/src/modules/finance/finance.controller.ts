import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { financeService } from "./finance.service.js";
import { summarizeFinanceRunway } from "./finance.ai.js";
import {
  createExpenseSchema,
  createFinanceSchema,
  createInvoiceSchema,
  financeRunwaySchema,
  listExpensesSchema,
  listInvoicesSchema,
  updateFinanceSchema,
  updateInvoiceStatusSchema,
} from "./finance.validators.js";
import type {
  CreateFinanceExpenseInput,
  CreateFinanceInvoiceInput,
  UpdateFinanceInvoiceStatusInput,
} from "./finance.types.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { parsePagination } from "../../core/http/pagination.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const items = await financeService.list({
      brandId: req.query.brandId as string | undefined,
      productId: req.query.productId as string | undefined,
      page,
      pageSize,
    });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await financeService.getById(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createFinanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await financeService.create(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateFinanceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const item = await financeService.update(id, parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await financeService.remove(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function runwaySummary(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = financeRunwaySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await summarizeFinanceRunway(parsed.data.brandId);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

function resolveFinanceBrand(req: AuthenticatedRequest, requestedBrandId?: string) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    requestedBrandId,
  );
  if (!brandId) {
    throw badRequest("brandId is required");
  }
  return brandId;
}

export async function listExpenses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brandId = resolveFinanceBrand(req, req.query.brandId as string | undefined);
    const { page, pageSize } = parsePagination(req.query);
    const parsed = listExpensesSchema.parse({ ...req.query, brandId });
    const payload = await financeService.listExpenses({ ...parsed, page, pageSize });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brandId = resolveFinanceBrand(req, req.body.brandId as string | undefined);
    const parsed = createExpenseSchema.parse({ ...req.body, brandId });
    const created = await financeService.createExpense(parsed as CreateFinanceExpenseInput);
    respondWithSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function listInvoices(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brandId = resolveFinanceBrand(req, req.query.brandId as string | undefined);
    const { page, pageSize } = parsePagination(req.query);
    const parsed = listInvoicesSchema.parse({ ...req.query, brandId });
    const payload = await financeService.listInvoices({ ...parsed, page, pageSize });
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const brandId = resolveFinanceBrand(req, req.body.brandId as string | undefined);
    const parsed = createInvoiceSchema.parse({ ...req.body, brandId });
    const created = await financeService.createInvoice(parsed as CreateFinanceInvoiceInput);
    respondWithSuccess(res, created, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateInvoiceStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const brandId = resolveFinanceBrand(req, req.query.brandId as string | undefined);
    const payload = updateInvoiceStatusSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    await financeService.ensureInvoiceBelongsToBrand(id, brandId);
    const updated = await financeService.updateInvoiceStatus(id, payload as UpdateFinanceInvoiceStatusInput);
    respondWithSuccess(res, updated);
  } catch (err) {
    next(err);
  }
}
