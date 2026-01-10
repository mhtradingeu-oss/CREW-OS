// Billing Ledger Model (Persistence Only)
import { prisma } from "../../../core/prisma.js";
import { BillingLedgerEntry } from "./billing-ledger.types.js";

export async function createBillingLedgerEntry(entry: BillingLedgerEntry) {
  // Ledger entries are immutable; only create, never update/delete
  return prisma.billingLedger.create({
    data: entry,
  });
}

export async function getBillingLedgerEntries(tenantId: string) {
  return prisma.billingLedger.findMany({
    where: { tenantId },
    orderBy: { timestamp: "asc" },
  });
}

// No update/delete methods allowed
