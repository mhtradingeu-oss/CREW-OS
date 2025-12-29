export interface StandListFilters {
  brandId?: string;
  partnerId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface StandSummary {
  id: string;
  name: string;
  status: string;
  standType?: string;
  description?: string;
  brandId?: string;
  partner?: {
    id: string;
    name?: string;
    status?: string;
  };
  locationCount: number;
  latestSnapshot?: {
    period?: string;
    metrics?: Record<string, unknown>;
  };
  lastRefillAt?: Date;
}

export interface StandListResult {
  items: StandSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StandLocationInput {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  region?: string;
  geoLocationJson?: string;
}

export interface StandCreateInput {
  standPartnerId: string;
  brandId?: string;
  name: string;
  standType?: string;
  description?: string;
  status?: string;
  initialLocation?: StandLocationInput;
}

export interface StandUpdateInput extends Partial<StandCreateInput> {}

export interface StandInventoryRecord {
  productId: string;
  productName?: string;
  quantity: number;
  status?: string;
  lastRefillAt?: Date;
}

export interface StandInventoryResponse {
  locationId: string;
  locationName: string;
  inventory: StandInventoryRecord[];
}

export interface StandRefillItemInput {
  productId: string;
  quantity: number;
  cost?: number;
  refillSource?: string;
}

export interface StandRefillInput {
  standLocationId: string;
  expectedAt?: string;
  partnerId?: string;
  source?: string;
  notes?: string;
  items: StandRefillItemInput[];
}

export interface StandRefillResult {
  id: string;
  status: string;
  standLocationId: string;
  expectedAt?: Date;
}

export interface StandPerformanceSummary {
  standId: string;
  standName: string;
  totalOrders: number;
  totalRevenue: number;
  stockOutLocations: number;
  refillOrdersPending: number;
  lastRefillAt?: Date;
  latestSnapshot?: {
    period?: string;
    metrics?: Record<string, unknown>;
  };
}

export interface StandAiStockRequest {
  brandId?: string;
  scope?: string;
  notes?: string;
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

export interface StandKpiDTO {
  standId: string;
  brandId?: string;
  totalSales: number;
  totalUnits: number;
  stockOutEvents: number;
  lastSaleAt?: Date | null;
  lastStockOutAt?: Date | null;
  regressionScore?: number;
  engagementScore?: number;
  standName?: string;
}

export interface StandKpiListParams {
  brandId: string;
  page?: number;
  pageSize?: number;
}

export interface StandKpiListResponse {
  items: StandKpiDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface StandKpiEventPayload extends StandKpiDTO {}

export interface StandPerformanceEventPayload {
  standId: string;
  brandId?: string;
  standName?: string;
  totalSales: number;
  totalUnits: number;
  stockOutEvents: number;
  regressionScore?: number;
}

export interface StandStockEventPayload {
  brandId?: string;
  standId: string;
  productId: string;
  count: number;
  lastStockOutAt?: Date | null;
}

export interface StandInsightResult {
  summary: string;
  recommendation?: string;
  details?: string;
  ai?: StandAiStockSuggestionDto;
}
