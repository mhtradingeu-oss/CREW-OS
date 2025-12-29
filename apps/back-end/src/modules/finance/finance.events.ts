export enum FinanceEvents {
  REVENUE_RECORDED = "finance.revenue.recorded",
  CREATED = "finance.created",
  UPDATED = "finance.updated",
  DELETED = "finance.deleted",
  EXPENSE_CREATED = "finance.expense.created",
  INVOICE_CREATED = "finance.invoice.created",
  INVOICE_STATUS_CHANGED = "finance.invoice.status.changed",
}

export async function emitFinanceRevenueRecorded(payload: FinanceEventPayload, context?: EventContext) {
  await publish(FinanceEvents.REVENUE_RECORDED, payload, context);
}
import { publish, type EventContext } from "../../core/events/event-bus.js";
import type {
  FinanceEventPayload,
  FinanceExpenseEventPayload,
  FinanceInvoiceEventPayload,
  FinanceInvoiceStatusEventPayload,
} from "./finance.types.js";

export async function emitFinanceCreated(payload: FinanceEventPayload, context?: EventContext) {
  await publish(FinanceEvents.CREATED, payload, context);
}

export async function emitFinanceUpdated(payload: FinanceEventPayload, context?: EventContext) {
  await publish(FinanceEvents.UPDATED, payload, context);
}

export async function emitFinanceDeleted(payload: FinanceEventPayload, context?: EventContext) {
  await publish(FinanceEvents.DELETED, payload, context);
}

export async function emitFinanceExpenseCreated(
  payload: FinanceExpenseEventPayload,
  context?: EventContext,
) {
  await publish(FinanceEvents.EXPENSE_CREATED, payload, context);
}

export async function emitFinanceInvoiceCreated(
  payload: FinanceInvoiceEventPayload,
  context?: EventContext,
) {
  await publish(FinanceEvents.INVOICE_CREATED, payload, context);
}

export async function emitFinanceInvoiceStatusChanged(
  payload: FinanceInvoiceStatusEventPayload,
  context?: EventContext,
) {
  await publish(FinanceEvents.INVOICE_STATUS_CHANGED, payload, context);
}
