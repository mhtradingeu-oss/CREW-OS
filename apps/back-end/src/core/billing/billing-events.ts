// Stub for emitBillingEvent to resolve import in usage-meter.ts
export function emitBillingEvent(event: Partial<BillingEvent>) {
  // TODO: Implement billing event emission logic
  return event;
}
// Billing Event Type — Canonical billing event for audit and automation

export type BillingEvent = {
  id: string;
  tenantId: string;
  usageKey: string;
  quantity: number;
  timestamp: Date;
  planCode: string; // PlanCode stub
  feature?: string; // FeatureKey stub
  limit?: number;
};
