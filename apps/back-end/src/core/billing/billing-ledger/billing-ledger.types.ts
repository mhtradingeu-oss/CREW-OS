// Billing Ledger Types (Phase 3)

export type BillingLedgerEntryStatus = "pending" | "invoiced" | "ignored";

export interface BillingLedgerEntry {
  id: string;
  tenantId: string;
  usageKey: string;
  feature?: string;
  quantity: number;
  unit: string;
  planCode: string;
  timestamp: Date;
  sourceEventId?: string;
  status: BillingLedgerEntryStatus;
}
