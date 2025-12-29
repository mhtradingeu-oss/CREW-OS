import { publish, type EventContext } from "../../core/events/event-bus.js";

export enum EInvoiceEvents {
  CREATED = "einvoice.created",
  SENT = "einvoice.sent",
}

export async function emitEInvoiceCreated(payload: { einvoiceId: string; invoiceId: string; format: string }, context?: EventContext) {
  await publish(EInvoiceEvents.CREATED, payload, context);
}

export async function emitEInvoiceSent(payload: { einvoiceId: string; invoiceId: string; format: string }, context?: EventContext) {
  await publish(EInvoiceEvents.SENT, payload, context);
}
