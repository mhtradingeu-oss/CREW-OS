// Billing Event → Ledger Processor (Phase 3)
import { BillingLedgerEntry } from "./billing-ledger/billing-ledger.types.js";
import { createBillingLedgerEntry } from "./billing-ledger/billing-ledger.model.js";

export async function processBillingEvent(event: {
  id: string;
  tenantId: string;
  usageKey: string;
  feature?: string;
  quantity: number;
  unit: string;
  planCode: string;
  timestamp: Date;
}) {
  // No calculations, no pricing, no invoice logic
  const entry: BillingLedgerEntry = {
    id: event.id,
    tenantId: event.tenantId,
    usageKey: event.usageKey,
    feature: event.feature,
    quantity: event.quantity,
    unit: event.unit,
    planCode: event.planCode,
    timestamp: event.timestamp,
    sourceEventId: event.id,
    status: "pending",
  };
  return createBillingLedgerEntry(entry);
}
