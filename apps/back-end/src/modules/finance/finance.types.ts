export interface CreateFinanceInput {
  brandId?: string;
  productId?: string;
  channel?: string;
  amount: number;
  currency?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface UpdateFinanceInput extends Partial<CreateFinanceInput> {}

export interface FinanceRecord {
  id: string;
  brandId?: string;
  productId?: string;
  channel?: string;
  amount?: number | null;
  currency?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceEventPayload {
  id: string;
  brandId?: string;
}

export interface CreateFinanceExpenseInput {
  brandId: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: string;
  description?: string;
}

export interface FinanceExpenseDTO {
  id: string;
  brandId: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceExpenseEventPayload {
  expenseId: string;
  brandId: string;
  category: string;
  amount: number;
  currency: string;
  incurredAt: string;
}

export interface CreateFinanceInvoiceInput {
  brandId: string;
  customerId?: string;
  externalId?: string;
  amount: number;
  currency: string;
  status?: string;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
}

export interface FinanceInvoiceDTO {
  id: string;
  brandId: string;
  customerId?: string;
  externalId?: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt?: string | null;
  dueAt?: string | null;
  paidAt?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceInvoiceEventPayload {
  invoiceId: string;
  brandId: string;
  amount: number;
  currency: string;
  status: string;
}

export interface UpdateFinanceInvoiceStatusInput {
  status: string;
  paidAt?: string;
}

export interface FinanceInvoiceStatusEventPayload {
  invoiceId: string;
  brandId: string;
  oldStatus: string;
  newStatus: string;
  amount: number;
  currency: string;
}

export interface FinanceSnapshot {
  revenue: number;
  expenses: number;
  net: number;
  outstandingInvoices: number;
}
