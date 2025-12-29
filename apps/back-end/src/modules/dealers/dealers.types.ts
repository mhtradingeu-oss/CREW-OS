export interface PartnerTierDTO {
  id: string;
  name: string;
  benefits?: string | null;
}

export interface PartnerDTO {
  id: string;
  brandId?: string;
  type: string;
  name: string;
  country?: string | null;
  city?: string | null;
  status?: string | null;
  tier?: PartnerTierDTO | null;
  createdAt: Date;
  updatedAt: Date;
  stats?: PartnerStatsDTO;
  settingsJson?: unknown;
}

export interface PartnerStatsDTO {
  totalOrders: number;
  totalRevenue: number;
  lastOrderAt?: Date | null;
  totalUnits?: number;
  activeStands?: number;
  engagementScore?: number;
}

export interface DealersDashboardSummary {
  totalPartners: number;
  activePartners: number;
  totalOrders: number;
  totalRevenue: number;
  totalStands: number;
  topCountries: Array<{ country: string; partners: number }>;
}

export interface PartnerListParams {
  brandId: string;
  search?: string;
  active?: boolean;
  tierId?: string;
  page?: number;
  pageSize?: number;
}

export interface PartnerListResponse {
  items: PartnerDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DealerKpiDTO {
  partnerId: string;
  brandId?: string;
  totalOrders: number;
  totalRevenue: number;
  totalUnits: number;
  activeStands: number;
  engagementScore?: number;
  lastOrderAt?: Date | null;
  partnerName?: string;
}

export interface DealerKpiListResponse {
  items: DealerKpiDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DealerKpiListParams {
  brandId?: string;
  page?: number;
  pageSize?: number;
}

export interface DealersKpiEventPayload extends DealerKpiDTO {
  partnerName?: string;
}

export interface PartnerCreateInput {
  brandId: string;
  type: string;
  name: string;
  country?: string;
  city?: string;
  tierId?: string;
  settingsJson?: Record<string, unknown> | string;
  status?: string;
}

export interface PartnerUpdateInput {
  type?: string;
  name?: string;
  country?: string | null;
  city?: string | null;
  tierId?: string | null;
  settingsJson?: Record<string, unknown> | string;
  status?: string | null;
}

export interface DealersEventPayload {
  brandId?: string;
  partnerId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
