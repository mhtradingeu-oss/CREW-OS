// Stand OS Types

export interface StandPartnerListParams {
  brandId: string;
  page?: number;
  pageSize?: number;
  search?: string; // partner name, city, country
  status?: string; // ACTIVE / INACTIVE
}

export interface StandPartnerDTO {
  id: string;
  brandId: string | null | undefined;
  partnerId: string;
  standType?: string | null;
  locationAddress?: string | null;
  status: string | null;

  createdAt: Date;
  updatedAt: Date;

  // Joined
  partner?: {
    name?: string | null;
    city?: string | null;
    country?: string | null;
  };

  // Stats (optional)
  totalUnits?: number;
  totalOrders?: number;
  totalRevenue?: number;
  stats?: StandPartnerStatsDTO | null;
}

export interface StandPartnerListResponse {
  items: StandPartnerDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StandPartnerCreateInput {
  brandId: string;
  partnerId: string;
  standType?: string;
  locationAddress?: string;
}

export interface StandPartnerUpdateInput {
  standType?: string;
  locationAddress?: string;
  status?: string;
}

export interface StandStatsDTO {
  standPartnerId: string;
  totalUnits: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt?: Date | null;
}

export interface StandInventoryDTO {
  id: string;
  standUnitId: string;
  standLocationId?: string | null;
  productId: string;
  quantity: number;
  lastRefillAt?: Date | null;
  status?: string | null;
}

export interface StandOrderDTO {
  id: string;
  standPartnerId: string;
  standId?: string | null;
  standLocationId?: string | null;
  status?: string | null;
  total?: number | null;
  createdAt: Date;
}

export interface StandPartnerStatsDTO {
  standPartnerId: string;
  totalUnits: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt?: Date | null;
}

export interface StandDashboardSummary {
  totalPartners: number;
  activePartners: number;
  totalUnits: number;
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt?: Date | null;
}

export interface StandEventPayload {
  brandId?: string;
  standPartnerId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
