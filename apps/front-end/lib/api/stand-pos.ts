import { apiFetch } from "./client";
import type { PaginatedResponse } from "./types";

export interface StandPartnerDto {
  id: string;
  name?: string;
  status?: string;
}

export interface StandDto {
  id: string;
  name: string;
  standType?: string;
  description?: string;
  status: string;
  brandId?: string;
  partner?: StandPartnerDto;
  locationCount: number;
  latestSnapshot?: {
    period?: string;
    metrics?: Record<string, unknown>;
  };
  lastRefillAt?: string;
}

export interface StandLocationInventoryDto {
  productId: string;
  productName?: string;
  quantity: number;
  status?: string;
  lastRefillAt?: string;
}

export interface StandInventorySummaryDto {
  locationId: string;
  locationName: string;
  inventory: StandLocationInventoryDto[];
}

export interface StandDetailDto extends StandDto {
  standPartner?: {
    id: string;
    status?: string;
    partner?: { id: string; name?: string };
  };
  locations: Array<{
    id: string;
    name: string;
    city?: string;
    country?: string;
    region?: string;
    inventories: StandLocationInventoryDto[];
  }>;
  packages: Array<{ id: string; name?: string; status?: string }>;
  loyaltyLedgers: Array<{ id: string; points?: number; balance?: number }>;
}

export interface StandRefillInputDto {
  standLocationId: string;
  expectedAt?: string;
  partnerId?: string;
  source?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    cost?: number;
    refillSource?: string;
  }>;
}

export interface StandRefillDto {
  id: string;
  status: string;
  standLocationId: string;
  expectedAt?: string;
}

export interface StandPerformanceKpiDto {
  standId: string;
  standName: string;
  totalOrders: number;
  totalRevenue: number;
  stockOutLocations: number;
  refillOrdersPending: number;
  lastRefillAt?: string;
  latestSnapshot?: {
    period?: string;
    metrics?: Record<string, unknown>;
  };
}

export interface StandAiStockSuggestionDto {
  lowStock: Array<{
    productId: string;
    sku?: string;
    name?: string;
    currentQty: number;
    suggestedQty: number;
    reason: string;
  }>;
  slowMovers: Array<{
    productId: string;
    sku?: string;
    name?: string;
    suggestion: string;
    campaignIdea?: string;
  }>;
  summary: string;
}

export interface StandCreatePayload {
  standPartnerId: string;
  brandId?: string;
  name: string;
  standType?: string;
  description?: string;
  status?: string;
  initialLocation?: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    region?: string;
    geoLocationJson?: string;
  };
}

export interface StandUpdatePayload {
  name?: string;
  standType?: string;
  description?: string;
  status?: string;
}

export interface StandListFilters {
  brandId?: string;
  partnerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listStands(params?: StandListFilters) {
  const { data } = await api.get<PaginatedResponse<StandDto>>("/stand-pos/stands", { params });
  return data;
}

export async function getStand(id: string) {
  const { data } = await api.get<StandDetailDto>(`/stand-pos/stands/${id}`);
  return data;
}

export async function getStandInventory(id: string) {
  const { data } = await api.get<StandInventorySummaryDto[]>(`/stand-pos/stands/${id}/inventory`);
  return data;
}

export async function createStand(payload: StandCreatePayload) {
  const { data } = await api.post<StandDto>("/stand-pos/stands", payload);
  return data;
}

export async function updateStand(id: string, payload: StandUpdatePayload) {
  const { data } = await api.put<StandDto>(`/stand-pos/stands/${id}`, payload);
  return data;
}

export async function createStandRefill(id: string, payload: StandRefillInputDto) {
  const { data } = await api.post<StandRefillDto>(`/stand-pos/stands/${id}/refills`, payload);
  return data;
}

export async function getStandPerformance(id: string) {
  const { data } = await api.get<StandPerformanceKpiDto>(`/stand-pos/stands/${id}/performance`);
  return data;
}

export async function getStandAiStockSuggestion(
  standId: string,
  payload: { brandId?: string; scope?: string; notes?: string },
) {
  const { data } = await api.post<StandAiStockSuggestionDto>(
    `/stand-pos/stands/${standId}/ai/stock`,
    payload,
  );
  return data;
}
