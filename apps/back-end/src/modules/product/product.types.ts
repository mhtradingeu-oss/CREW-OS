export interface CreateProductInput {
  brandId?: string;
  categoryId?: string;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  status?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  qrCodeUrl?: string | null;
  lifecycleStage?: string | null;
  tags?: string[] | null;
  marketingProfile?: Record<string, unknown> | null;
  seoProfile?: Record<string, unknown> | null;
  distributionProfile?: Record<string, unknown> | null;
  complianceProfile?: Record<string, unknown> | null;
  localizationProfile?: Record<string, unknown> | null;
  socialProof?: Record<string, unknown> | null;
  analyticsProfile?: Record<string, unknown> | null;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface ProductEventPayload {
  id: string;
  brandId?: string | null;
}

export interface ProductPricingSnapshot {
  id: string;
  productId: string;
  brandId?: string | null;
  cogsEur?: number | null;
  fullCostEur?: number | null;
  b2cNet?: number | null;
  b2cGross?: number | null;
  dealerNet?: number | null;
  dealerPlusNet?: number | null;
  standPartnerNet?: number | null;
  distributorNet?: number | null;
  amazonNet?: number | null;
  uvpNet?: number | null;
  vatPct?: number | null;
}

export interface CompetitorPriceSnapshot {
  id: string;
  productId: string;
  brandId?: string | null;
  competitor: string;
  marketplace?: string | null;
  country?: string | null;
  priceNet?: number | null;
  priceGross?: number | null;
  currency?: string | null;
  collectedAt?: Date | null;
}

export interface ProductResponse {
  id: string;
  brandId?: string | null;
  categoryId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  status?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  qrCodeUrl?: string | null;
  lifecycleStage?: string | null;
  tags?: string[] | null;
  marketingProfile?: Record<string, unknown> | null;
  seoProfile?: Record<string, unknown> | null;
  distributionProfile?: Record<string, unknown> | null;
  complianceProfile?: Record<string, unknown> | null;
  localizationProfile?: Record<string, unknown> | null;
  socialProof?: Record<string, unknown> | null;
  analyticsProfile?: Record<string, unknown> | null;
  pricing?: ProductPricingSnapshot | null;
  competitorPrices?: CompetitorPriceSnapshot[];
  inventoryItemCount: number;
  complianceDocIds?: string[];
  specDocIds?: string[];
  mediaIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFilters {
  search?: string;
  brandId?: string;
  categoryId?: string;
  status?: string;
  lifecycleStage?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProducts {
  items: ProductResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductInsightResponse {
  id: string;
  summary: string;
  details: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductImportItem {
  id?: string;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  ean?: string | null;
  upc?: string | null;
  qrCodeUrl?: string | null;
  lifecycleStage?: string | null;
  tags?: string[] | null;
  marketingProfile?: Record<string, unknown> | null;
  seoProfile?: Record<string, unknown> | null;
  distributionProfile?: Record<string, unknown> | null;
  complianceProfile?: Record<string, unknown> | null;
  localizationProfile?: Record<string, unknown> | null;
  socialProof?: Record<string, unknown> | null;
  analyticsProfile?: Record<string, unknown> | null;
  categoryId?: string;
  status?: string;
  complianceDocIds?: string[];
  specDocIds?: string[];
  mediaIds?: string[];
  pricing?: {
    cogsEur?: number | null;
    fullCostEur?: number | null;
    b2cNet?: number | null;
    dealerNet?: number | null;
    standPartnerNet?: number | null;
  };
}

export interface ProductImportPayload {
  brandId?: string;
  items: ProductImportItem[];
}

export interface ProductImportResult {
  imported: number;
  updated: number;
}

export interface ProductExportFilters {
  brandId?: string;
  search?: string;
  status?: string;
  lifecycleStage?: string;
  format?: "json" | "csv";
}

export interface ProductExportResult {
  format: "json" | "csv";
  payload: string | ProductResponse[];
}

export interface ProductMediaPayload {
  mediaIds: string[];
}
