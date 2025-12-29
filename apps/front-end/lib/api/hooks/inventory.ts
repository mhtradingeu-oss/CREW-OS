import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../client.ts';

// Types (best effort, update as backend/types evolve)
export interface InventoryItem {
  id: string;
  name: string;
  sku?: string;
  stock?: number;
  threshold?: number;
  status?: string;
  [key: string]: unknown;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface InventoryInsights {
  totalItems?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  [key: string]: unknown;
}

export interface CreateInventoryItemInput {
  name: string;
  sku?: string;
  stock?: number;
  threshold?: number;
  [key: string]: unknown;
}

export interface CreateInventoryAdjustmentInput {
  inventoryId: string;
  amount: number;
  reason?: string;
  [key: string]: unknown;
}

// GET /api/v1/inventory
export function useInventories(params?: {
  page?: number;
  limit?: number;
  search?: string; // TODO: Confirm backend support
  status?: string; // TODO: Confirm backend support
  lowStock?: boolean; // TODO: Confirm backend support
}) {
  return useQuery({
    queryKey: ['inventories', params],
    queryFn: async () => {
      const { data } = await api.get<InventoryListResponse>('/api/v1/inventory', { params });
      return data;
    },
    keepPreviousData: true,
  });
}

// GET /api/v1/inventory/:id
export function useInventory(id?: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: async () => {
      if (!id) throw new Error('No inventory id');
      const { data } = await api.get<InventoryItem>(`/api/v1/inventory/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

// GET /api/v1/inventory/insights
export function useInventoryInsights() {
  return useQuery({
    queryKey: ['inventory-insights'],
    queryFn: async () => {
      const { data } = await api.get<InventoryInsights>('/api/v1/inventory/insights');
      return data;
    },
  });
}

// POST /api/v1/inventory
export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryItemInput) => {
      const { data } = await api.post<InventoryItem>('/api/v1/inventory', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventories']);
      queryClient.invalidateQueries(['inventory-insights']);
    },
  });
}

// POST /api/v1/inventory/adjustments
export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateInventoryAdjustmentInput) => {
      const { data } = await api.post('/api/v1/inventory/adjustments', input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['inventories']);
      queryClient.invalidateQueries(['inventory-insights']);
    },
  });
}
