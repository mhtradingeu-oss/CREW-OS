// Competitor DTOs migrated from backend

export interface ScanCompetitorsInput {
  brandId?: string;
  market?: string;
  keywords?: string[];
  includeAutoUpdates?: boolean;
}

export interface CompetitorPriceRecord {
  competitorId: string;
  productId?: string;
  name: string;
  price: number;
  currency: string;
  source?: string;
  updatedAt?: string;
}

export interface ScanResult {
  items: CompetitorPriceRecord[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
}

export interface GetCompetitorPricesInput {
  brandId?: string;
  productId?: string;
  competitorId?: string;
  country?: string;
  page?: number;
  pageSize?: number;
}
