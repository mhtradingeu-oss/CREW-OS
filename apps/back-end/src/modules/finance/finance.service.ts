/**
 * FINANCE SERVICE — MH-OS v2
 * Spec: docs/os/21_finance-os.md (MASTER_INDEX)
 */
import {
  findRevenueRecords,
  countRevenueRecords,
  findRevenueRecordById,
  createRevenueRecord,
  updateRevenueRecord,
  deleteRevenueRecord,
  findExpenses,
  countExpenses,
  createExpense,
  findExpenseById,
  updateExpense,
  deleteExpense,
  findInvoices,
  countInvoices,
  createInvoice,
  findInvoiceById,
  updateInvoice,
  deleteInvoice,
  aggregateRevenue,
  aggregateExpenses,
  aggregateOutstandingInvoices,
  runFinanceTransaction,
} from "../../core/db/repositories/finance.repository.js";
import type { PrismaPromise } from "@prisma/client";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import {
  emitFinanceRevenueRecorded,
  emitFinanceDeleted,
  emitFinanceExpenseCreated,
  emitFinanceInvoiceCreated,
  emitFinanceInvoiceStatusChanged,
  emitFinanceUpdated,
} from "./finance.events.js";
import type {
  CreateFinanceInput,
  CreateFinanceExpenseInput,
  CreateFinanceInvoiceInput,
  FinanceExpenseDTO,
  FinanceInvoiceDTO,
  FinanceRecord,
  FinanceSnapshot,
  UpdateFinanceInput,
  UpdateFinanceInvoiceStatusInput,
} from "./finance.types.js";

type RevenueRows = Awaited<ReturnType<typeof findRevenueRecords>>;
type ExpenseRows = Awaited<ReturnType<typeof findExpenses>>;
type InvoiceRows = Awaited<ReturnType<typeof findInvoices>>;
type RevenueAggregateResult = Awaited<ReturnType<typeof aggregateRevenue>>;
type ExpenseAggregateResult = Awaited<ReturnType<typeof aggregateExpenses>>;
type InvoiceAggregateResult = Awaited<ReturnType<typeof aggregateOutstandingInvoices>>;

// Repository controls DB shape

function mapExpense(record: any): FinanceExpenseDTO {
  return {
    id: record.id,
    brandId: record.brandId,
    category: record.category,
    amount: record.amount ? (typeof record.amount.toNumber === "function" ? record.amount.toNumber() : Number(record.amount)) : 0,
    currency: record.currency,
    incurredAt: record.incurredAt ? record.incurredAt.toISOString() : undefined,
    description: record.description ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapInvoice(record: any): FinanceInvoiceDTO {
  return {
    id: record.id,
    brandId: record.brandId,
    customerId: record.customerId ?? undefined,
    externalId: record.externalId ?? undefined,
    amount: record.amount ? (typeof record.amount.toNumber === "function" ? record.amount.toNumber() : Number(record.amount)) : 0,
    currency: record.currency,
    status: record.status ?? "draft",
    issuedAt: record.issuedAt ? record.issuedAt.toISOString() : undefined,
    dueAt: record.dueAt ? record.dueAt.toISOString() : undefined,
    paidAt: record.paidAt ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}


class FinanceService {

  async list(
    params: { brandId?: string; productId?: string; page?: number; pageSize?: number } = {},
  ) {
    const { brandId, productId, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (productId) where.productId = productId;
    const ops: PrismaPromise<any>[] = [countRevenueRecords(where), findRevenueRecords(where)];
    const [total, rows] = (await runFinanceTransaction(ops)) as [number, RevenueRows];
    return {
      items: rows.map((row) => this.map(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async getById(id: string): Promise<FinanceRecord> {
    const record = await findRevenueRecordById(id);
    if (!record) throw notFound("Finance record not found");
    return this.map(record);
  }

  async create(input: CreateFinanceInput): Promise<FinanceRecord> {
    if (input.amount === undefined || input.amount === null) {
      throw badRequest("amount is required");
    }
    if (!input.currency || typeof input.currency !== "string") {
      throw badRequest("currency is required and must be a string");
    }
    const created = await createRevenueRecord({
      brandId: input.brandId ?? undefined,
      productId: input.productId ?? undefined,
      channel: input.channel ?? undefined,
      amount: input.amount,
      currency: input.currency,
      periodStart: input.periodStart ? new Date(input.periodStart) : undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : undefined,
    });
    await emitFinanceRevenueRecorded(
      { id: created.id, brandId: created.brandId ?? undefined },
      { brandId: created.brandId ?? undefined, source: "api" },
    );
    return this.map(created);
  }

  async update(id: string, input: UpdateFinanceInput): Promise<FinanceRecord> {
    const existing = await findRevenueRecordById(id);
    if (!existing) throw notFound("Finance record not found");

    const updated = await updateRevenueRecord(id, {
      brandId: input.brandId ?? this.coerceString(existing.brandId),
      productId: input.productId ?? this.coerceString(existing.productId),
      channel: input.channel ?? this.coerceString(existing.channel),
      amount: input.amount ?? this.coerceNumber(existing.amount),
      currency: input.currency ?? this.coerceString(existing.currency),
      periodStart: input.periodStart ? new Date(input.periodStart) : existing.periodStart ?? undefined,
      periodEnd: input.periodEnd ? new Date(input.periodEnd) : existing.periodEnd ?? undefined,
    });
    await emitFinanceUpdated(
      { id: updated.id, brandId: updated.brandId ?? undefined },
      { brandId: updated.brandId ?? undefined, source: "api" },
    );
    return this.map(updated);
  }

  async remove(id: string) {
    const record = await findRevenueRecordById(id);
    if (!record) throw notFound("Finance record not found");
    await deleteRevenueRecord(id);
    await emitFinanceDeleted(
      { id, brandId: record.brandId ?? undefined },
      { brandId: record.brandId ?? undefined, source: "api" },
    );
    return { id };
  }

  async listExpenses(params: {
    brandId: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { brandId, category, startDate, endDate, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: any = { brandId };
    if (category) where.category = category;
    if (startDate || endDate) {
      where.incurredAt = {};
      if (startDate) where.incurredAt.gte = new Date(startDate);
      if (endDate) where.incurredAt.lte = new Date(endDate);
    }
    const ops: PrismaPromise<any>[] = [countExpenses(where), findExpenses(where)];
    const [total, rows] = (await runFinanceTransaction(ops)) as [number, ExpenseRows];
    return {
      items: rows.map((row) => mapExpense(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async createExpense(input: CreateFinanceExpenseInput): Promise<FinanceExpenseDTO> {
    if (input.amount === undefined || input.amount === null) {
      throw badRequest("amount is required");
    }
    if (!input.currency || typeof input.currency !== "string") {
      throw badRequest("currency is required and must be a string");
    }
    const created = await createExpense({
      brandId: input.brandId,
      category: input.category,
      amount: input.amount,
      currency: input.currency,
      incurredAt: new Date(input.incurredAt),
      description: input.description ?? undefined,
    });

    await emitFinanceExpenseCreated(
      {
        expenseId: created.id,
        brandId: created.brandId,
        category: created.category,
        amount: Number(created.amount),
        currency: created.currency,
        incurredAt: created.incurredAt.toISOString(),
      },
      { brandId: created.brandId, source: "api" },
    );

    return mapExpense(created);
  }

  async listInvoices(params: {
    brandId: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { brandId, status, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: any = { brandId };
    if (status) where.status = status;
    const ops: PrismaPromise<any>[] = [countInvoices(where), findInvoices(where, { skip, take })];
    const [total, rows] = (await runFinanceTransaction(ops)) as [number, InvoiceRows];
    return {
      items: rows.map((row) => mapInvoice(row)),
      total,
      page,
      pageSize: take,
    };
  }

  async createInvoice(input: CreateFinanceInvoiceInput): Promise<FinanceInvoiceDTO> {
    const created = await createInvoice({
      brandId: input.brandId,
      customerId: input.customerId,
      currency: input.currency,
      amount: input.amount,
      items: [], // Add items if needed
    });

    await emitFinanceInvoiceCreated(
      {
        invoiceId: created.id,
        brandId: created.brandId,
        amount: Number(created.amount),
        currency: created.currency,
        status: created.status ?? "draft",
      },
      { brandId: created.brandId, source: "api" },
    );

    return mapInvoice(created);
  }

  async updateInvoiceStatus(
    invoiceId: string,
    input: UpdateFinanceInvoiceStatusInput,
  ): Promise<FinanceInvoiceDTO> {
    const existing = await findInvoiceById(invoiceId);
    if (!existing) throw notFound("Invoice not found");

    const updated = await updateInvoice(invoiceId, {
      status: input.status as any, // Ensure correct enum
      paidAt: input.paidAt ? new Date(input.paidAt) : existing.paidAt ?? undefined,
    });

    await emitFinanceInvoiceStatusChanged(
      {
        invoiceId: updated.id,
        brandId: updated.brandId,
        oldStatus: existing.status ?? "draft",
        newStatus: updated.status ?? "draft",
        amount: Number(updated.amount),
        currency: updated.currency,
      },
      { brandId: updated.brandId, source: "api" },
    );

    return mapInvoice(updated);
  }

  async buildFinancialSnapshot(brandId: string): Promise<FinanceSnapshot> {
    const ops: PrismaPromise<any>[] = [
      aggregateRevenue({ brandId }),
      aggregateExpenses({ brandId }),
      aggregateOutstandingInvoices({ brandId, status: "issued" }),
    ];
    const [revenueAgg, expenseAgg, invoiceAgg] = (await runFinanceTransaction(ops)) as [
      RevenueAggregateResult,
      ExpenseAggregateResult,
      InvoiceAggregateResult,
    ];
    const revenue = revenueAgg._sum?.amount ? (typeof revenueAgg._sum.amount.toNumber === "function" ? revenueAgg._sum.amount.toNumber() : Number(revenueAgg._sum.amount)) : 0;
    const expenses = expenseAgg._sum?.amount ? (typeof expenseAgg._sum.amount.toNumber === "function" ? expenseAgg._sum.amount.toNumber() : Number(expenseAgg._sum.amount)) : 0;
    const outstandingInvoices = invoiceAgg._sum?.amount ? (typeof invoiceAgg._sum.amount.toNumber === "function" ? invoiceAgg._sum.amount.toNumber() : Number(invoiceAgg._sum.amount)) : 0;
    return {
      revenue,
      expenses,
      net: revenue - expenses,
      outstandingInvoices,
    };
  }

  async ensureInvoiceBelongsToBrand(invoiceId: string, brandId: string) {
    const record = await findInvoiceById(invoiceId);
    if (!record) {
      throw notFound("Invoice not found");
    }
    if (record.brandId !== brandId) {
      throw badRequest("Invoice does not belong to the requested brand");
    }
    return mapInvoice(record);
  }

  private map(
    row: any,
  ): FinanceRecord {
    return {
      id: row.id,
      brandId: row.brandId ?? undefined,
      productId: row.productId ?? undefined,
      channel: row.channel ?? undefined,
      amount: row.amount ? Number(row.amount) : null,
      currency: row.currency ?? undefined,
      periodStart: row.periodStart ? row.periodStart.toISOString() : undefined,
      periodEnd: row.periodEnd ? row.periodEnd.toISOString() : undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  private coerceString(value?: string | null): string | undefined {
    return value ?? undefined;
  }

  private coerceNumber(value?: number | { toNumber?: () => number } | null): number | undefined {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number") return value;
    if (typeof value.toNumber === "function") return value.toNumber();
    return Number(value);
  }
}

export const financeService = new FinanceService();
