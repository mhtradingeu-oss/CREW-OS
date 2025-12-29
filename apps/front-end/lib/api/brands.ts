
import { apiFetch } from '@/lib/api/client';
import type { Brand, PaginatedResponse } from '@/lib/api/types';

// V1 READ-ONLY: List brands
export async function listBrands(): Promise<Brand[]> {
  const { data } = await apiFetch<PaginatedResponse<Brand>>('/api/v1/brand');
  return data?.items ?? [];
}
