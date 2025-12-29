import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../client.ts';

// Types
export interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

// Query keys
const productKeys = {
  all: ['products'] as const,
  list: (params: ProductListParams) => [
    ...productKeys.all,
    'list',
    params.page ?? 1,
    params.limit ?? 10,
    params.search ?? '',
    params.status ?? '',
  ] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
};

// Hooks
export function useProducts(params: ProductListParams) {
  return useQuery<ProductListResponse, Error>({
    queryKey: productKeys.list(params),
    queryFn: async () => {
      const { data } = await api.get<ProductListResponse>('/api/v1/product', { params });
      return data;
    },
    keepPreviousData: true,
  });
}

export function useProduct(id: string) {
  return useQuery<Product, Error>({
    queryKey: productKeys.detail(id),
    queryFn: async () => {
      const { data } = await api.get<Product>(`/api/v1/product/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
