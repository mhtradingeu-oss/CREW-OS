import type { Prisma } from "@prisma/client";

// Revenue Types
export type RevenueRecordWhere = {
  brandId?: string;
  productId?: string;
};

export type CreateRevenueInput = {
  brandId?: string;
  productId?: string;
  channel?: string;
  amount: number;
  currency: string;
  periodStart?: Date;
  periodEnd?: Date;
};

export type UpdateRevenueInput = Partial<CreateRevenueInput>;

// Expense Types
export type ExpenseWhere = {
  brandId: string;
  category?: string;
  incurredAt?: { gte?: Date; lte?: Date };
};

export type CreateExpenseInput = {
  brandId: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: Date;
  description?: string;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

// Aggregate Types
export type AggregateWhere = {
  brandId: string;
  status?: InvoiceStatus;
};

// E-Invoice Types
export type EInvoiceWhere = {
  invoiceId: string;
  format?: string;
};

export type EInvoiceFindParams = {
  where: EInvoiceWhere;
  orderBy?: Prisma.EInvoiceOrderByWithRelationInput;
};

export type CreateEInvoiceInput = {
  invoiceId: string;
  format: string;
  xmlData: string;
  validationErrors?: string[];
  validated: boolean;
  peppolSent: boolean;
  peppolMessageId?: string | null;
};

export type UpdateEInvoiceInput = Partial<CreateEInvoiceInput>;
// Local Types
export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled";

export type FinanceInvoiceWhere = {
  brandId: string;
  customerId?: string;
  status?: InvoiceStatus;
};

export type CreateInvoiceInput = {
  brandId: string;
  customerId?: string;
  currency: string;
  amount: number;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type UpdateInvoiceInput = {
  status?: InvoiceStatus;
  paidAt?: Date;
};

type TransactionClient = unknown;
// GLOBAL CONSTRAINTS (NON-NEGOTIABLE):
// - No Prisma usage outside core/db/repositories/**
// - No Prisma types leaked to services, controllers, or DTOs
// - Do NOT modify Prisma schema
// - Do NOT change API response shapes unless required for safety
// - Do NOT weaken RBAC
// - Services = orchestration + validation + mapping only
// - Repositories = Prisma-only logic (queries, transactions, aggregates)
// - All monetary mapping handled in services (Decimal → number)
// - Preserve existing business logic and behavior

import { prisma } from "../../prisma.js";

// Revenue Records
export function findRevenueRecords(where: RevenueRecordWhere) {
  return prisma.revenueRecord.findMany({ where });
}
export function countRevenueRecords(where: RevenueRecordWhere) {
  return prisma.revenueRecord.count({ where });
}
export function findRevenueRecordById(id: string) {
  return prisma.revenueRecord.findUnique({ where: { id } });
}
export function createRevenueRecord(data: CreateRevenueInput) {
  return prisma.revenueRecord.create({ data });
}
export function updateRevenueRecord(id: string, data: UpdateRevenueInput) {
  return prisma.revenueRecord.update({ where: { id }, data });
}
export function deleteRevenueRecord(id: string) {
  return prisma.revenueRecord.delete({ where: { id } });
}

// Expenses
export function findExpenses(where: ExpenseWhere) {
  return prisma.financeExpense.findMany({ where });
}
export function countExpenses(where: ExpenseWhere) {
  return prisma.financeExpense.count({ where });
}
export function createExpense(data: CreateExpenseInput) {
  return prisma.financeExpense.create({ data });
}
export function findExpenseById(id: string) {
  return prisma.financeExpense.findUnique({ where: { id } });
}
export function updateExpense(id: string, data: UpdateExpenseInput) {
  return prisma.financeExpense.update({ where: { id }, data });
}
export function deleteExpense(id: string) {
  return prisma.financeExpense.delete({ where: { id } });
}

// Invoices
export function findInvoices(
  where: FinanceInvoiceWhere,
  pagination: { skip: number; take: number }
) {
  return prisma.financeInvoice.findMany({
    where,
    skip: pagination.skip,
    take: pagination.take,
  });
}

export function countInvoices(where: FinanceInvoiceWhere) {
  return prisma.financeInvoice.count({ where });
}

export function createInvoice(
  data: CreateInvoiceInput,
  tx?: TransactionClient
) {
  // tx is for transaction support, not exported
  return prisma.financeInvoice.create({ data });
}

export function findInvoiceById(id: string) {
  return prisma.financeInvoice.findUnique({ where: { id } });
}

export function updateInvoice(
  id: string,
  data: UpdateInvoiceInput,
  tx?: TransactionClient
) {
  return prisma.financeInvoice.update({ where: { id }, data });
}

export function deleteInvoice(id: string) {
  return prisma.financeInvoice.delete({ where: { id } });
}

// Aggregates
export function aggregateRevenue(where: AggregateWhere) {
  return prisma.revenueRecord.aggregate({ where, _sum: { amount: true } });
}
export function aggregateExpenses(where: AggregateWhere) {
  return prisma.financeExpense.aggregate({ where, _sum: { amount: true } });
}
export function aggregateOutstandingInvoices(where: AggregateWhere) {
  return prisma.financeInvoice.aggregate({ where, _sum: { amount: true } });
}

// Transactional blocks
import type { PrismaPromise } from "@prisma/client";
export function runFinanceTransaction(actions: PrismaPromise<any>[]) {
  return prisma.$transaction(actions);
}

// E-Invoice (for einvoice.service.ts)
export function findEInvoice(params: EInvoiceFindParams) {
  return prisma.eInvoice.findFirst({
    where: params.where,
    orderBy: params.orderBy,
  });
}
export function createEInvoice(data: CreateEInvoiceInput) {
  return prisma.eInvoice.create({ data });
}
export function updateEInvoice(id: string, data: UpdateEInvoiceInput) {
  return prisma.eInvoice.update({ where: { id }, data });
}
export function updateManyEInvoice(where: EInvoiceWhere, data: UpdateEInvoiceInput) {
  return prisma.eInvoice.updateMany({ where, data });
}
export function findInvoiceWithItems(invoiceId: string) {
  return prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      brand: { select: { id: true, tenantId: true, name: true, defaultCurrency: true } },
    },
  });
}
