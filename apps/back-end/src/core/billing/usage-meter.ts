// Unified Usage Meter — The ONLY allowed entry point for usage metering, plan limit checks, and billing event emission
// DO NOT duplicate logic or use string keys. All usage must go through this function.

// Accepts any object with optional user property for compatibility
import { USAGE_METERS, type UsageMeterKey } from "./usage-registry.js";
import { emitBillingEvent } from "./billing-events.js";
import { resolveSubscriptionState } from "./subscription-resolver.js";

export type RecordUsageInput = {
  key: UsageMeterKey;
  quantity?: number;
    req: any;
};

export function recordUsage({
  key,
  quantity = 1,
  req,
}: RecordUsageInput): void {
  if (!USAGE_METERS[key]) {
    throw new Error(`Unknown usage key: ${String(key)}`);
  }

  const usageDef = USAGE_METERS[key] as typeof USAGE_METERS[keyof typeof USAGE_METERS];
  const { tenantId, planCode, entitlements } = resolveSubscriptionState(req);

  // --- LIMIT CHECK ONLY (IN-MEMORY / TEMP) ---
  // NOTE: Usage metering is not implemented; only limit checks are performed
  const isBillable = usageDef.billable === true;
  if (isBillable && 'limitKey' in usageDef && usageDef.limitKey) {
    const limitKey = usageDef.limitKey;
    const limit = entitlements.limits[limitKey];
    if (limit !== undefined && quantity > limit) {
      emitBillingEvent({
        tenantId,
        planCode,
        feature: usageDef.feature,
        usageKey: key,
        quantity,
        limit,
        timestamp: new Date(),
      });
    }
  }
  // --- NON-BILLABLE USAGE (TELEMETRY ONLY) ---
  // Intentionally no side effects here
}
