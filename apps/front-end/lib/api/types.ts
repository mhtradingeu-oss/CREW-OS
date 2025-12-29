// V1: Alias for legacy compatibility
export type PaginatedResponse<T> = ApiListResponse<T>;

// Shared API response types for presenter layer (read-only)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

export interface Brand {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  brandId: string;
  price: number;
}

export interface Pricing {
  id: string;
  productId: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo?: string;
}

export interface LoyaltyStatus {
  userId: string;
  points: number;
  tier: string;
}

export interface GovernanceApproval {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  decisionBy?: string;
  decisionAt?: string;
}

export interface ApiListResponse<T> {
  items: T[];
  total: number;
}
