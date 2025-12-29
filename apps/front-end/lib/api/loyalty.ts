// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.
export async function listLoyaltyCustomers() { return []; }
export async function updateLoyaltyCustomer() { return undefined; }

// Loyalty API (read-only, presenter layer)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

import { apiFetch } from '@/lib/api/client';
import type { LoyaltyStatus } from '@/lib/api/types';

export async function getLoyaltyStatus(userId: string): Promise<LoyaltyStatus> {
  return apiFetch<LoyaltyStatus>(`/api/v1/loyalty/status/${userId}`);
}
