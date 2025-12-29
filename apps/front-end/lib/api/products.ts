// Products API (read-only, presenter layer)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

import { apiFetch } from '@/lib/api/client';
import type { Product, ApiListResponse } from '@/lib/api/types';

export async function listProducts(): Promise<ApiListResponse<Product>> {
  return apiFetch<ApiListResponse<Product>>('/api/v1/product');
}

export async function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/v1/product/${id}`);
}
