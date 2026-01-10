// Invoice Draft Types (Phase 3)

export interface InvoiceDraftLineItem {
  usageKey: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceDraft {
  id: string;
  tenantId: string;
  period: string; // "YYYY-MM"
  lineItems: InvoiceDraftLineItem[];
  total: number;
  currency: "EUR";
}
