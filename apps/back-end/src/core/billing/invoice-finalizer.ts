// Invoice Finalizer (Phase 3)
import { InvoiceDraft } from "./invoicing/invoice-draft.types.js";
import { BillingLedgerEntry } from "./billing-ledger/billing-ledger.types.js";
import { prisma } from "../prisma.js";

export async function finalizeInvoice(draft: InvoiceDraft) {
  // Lock ledger entries for this invoice
  await prisma.billingLedger.updateMany({
    where: {
      tenantId: draft.tenantId,
      timestamp: {
        gte: new Date(`${draft.period}-01T00:00:00.000Z`),
        lt: new Date(`${draft.period}-31T23:59:59.999Z`),
      },
      status: "pending",
    },
    data: { status: "invoiced" },
  });

  // Persist final invoice (placeholder)
  // TODO: Implement InvoiceFinal model and persistence

  // Produce payment payload (placeholder only)
  return {
    invoiceId: draft.id,
    total: draft.total,
    currency: draft.currency,
    paymentPayload: {},
  };
}
