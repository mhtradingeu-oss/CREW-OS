import { z } from "zod";

export const createFinanceSchema = z.object({
  brandId: z.string().optional(),
  productId: z.string().optional(),
  channel: z.string().optional(),
  amount: z.number(),
  currency: z.string().optional(),
  periodStart: z.string().optional(),
  periodEnd: z.string().optional(),
});

export const updateFinanceSchema = createFinanceSchema.partial();

export const financeRunwaySchema = z.object({
  brandId: z.string().min(1),
});

export const listExpensesSchema = z.object({
  brandId: z.string().min(1),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createExpenseSchema = z.object({
  brandId: z.string().min(1),
  category: z.string().min(1),
  amount: z.number().positive(),
  currency: z.string().min(1),
  incurredAt: z.string().datetime(),
  description: z.string().optional(),
});

export const listInvoicesSchema = z.object({
  brandId: z.string().min(1),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const createInvoiceSchema = z.object({
  brandId: z.string().min(1),
  customerId: z.string().optional(),
  externalId: z.string().optional(),
  amount: z.number().positive(),
  currency: z.string().min(1),
  status: z.string().optional(),
  issuedAt: z.string().datetime().optional(),
  dueAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
});

export const updateInvoiceStatusSchema = z.object({
  status: z.string().min(1),
  paidAt: z.string().datetime().optional(),
});
