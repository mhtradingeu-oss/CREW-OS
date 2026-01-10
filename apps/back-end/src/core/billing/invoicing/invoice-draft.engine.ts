// Invoice Draft Engine (Phase 3)
import { InvoiceDraft, InvoiceDraftLineItem } from "./invoice-draft.types.js";
import { BillingLedgerEntry } from "../billing-ledger/billing-ledger.types.js";
import { resolveUnitPrice } from "../pricing-resolver.js";

export function generateInvoiceDraft(
  tenantId: string,
  period: string,
  ledgerEntries: BillingLedgerEntry[]
): InvoiceDraft {
  // Filter entries for the period and tenant
  const filtered = ledgerEntries.filter(
    (e) => e.tenantId === tenantId && e.timestamp.toISOString().startsWith(period)
  );

  // Group by usageKey
  const lineItemsMap = new Map<string, { quantity: number; unit: string; planCode: string }>();
  for (const entry of filtered) {
    const key = entry.usageKey;
    if (!lineItemsMap.has(key)) {
      lineItemsMap.set(key, { quantity: 0, unit: entry.unit, planCode: entry.planCode });
    }
    lineItemsMap.get(key)!.quantity += entry.quantity;
  }

  // Build line items
  const lineItems: InvoiceDraftLineItem[] = [];
  for (const [usageKey, { quantity, unit, planCode }] of lineItemsMap.entries()) {
    const unitPrice = resolveUnitPrice(planCode, usageKey, quantity);
    lineItems.push({
      usageKey,
      quantity,
      unitPrice,
      subtotal: unitPrice * quantity,
    });
  }

  const total = lineItems.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    id: `${tenantId}-${period}`,
    tenantId,
    period,
    lineItems,
    total,
    currency: "EUR",
  };
}
