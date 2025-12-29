export interface WhiteLabelEventPayload {
  id: string;
  brandId: string;
  wlBrandId?: string;
  name?: string;
  slug?: string;
}

export interface WhiteLabelBrandDTO {
  id: string;
  brandId?: string;
  ownerPartnerId?: string;
  ownerAffiliateId?: string;
  name: string;
  slug: string;
  status?: string;
  settings?: unknown;
  createdAt: Date;
  updatedAt: Date;
  stats?: WLBrandStatsDTO;
}

export interface WhiteLabelProductPricingDTO {
  id: string;
  pricing?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelProductDTO {
  id: string;
  wlBrandId: string;
  baseProductId?: string;
  name: string;
  sku?: string;
  pricing?: WhiteLabelProductPricingDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelPricingDTO {
  id: string;
  wlBrandId: string;
  productId?: string;
  pricing?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelOrderDTO {
  id: string;
  wlBrandId: string;
  status?: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteLabelOrderEventPayload {
  brandId: string;
  wlBrandId: string;
  orderId: string;
  totalAmount?: number;
  currency?: string;
  oldStatus?: string;
  newStatus?: string;
}

export interface WhiteLabelPricingSyncEventPayload {
  brandId: string;
  wlBrandId: string;
  productId: string;
  currentPrice: number;
  targetChannels?: string[];
}

export interface WLBrandStatsDTO {
  brandId: string;
  productsCount: number;
  ordersCount: number;
  totalRevenue: number;
}

export interface WLBrandListParams {
  brandId: string;
  ownerPartnerId?: string;
  ownerAffiliateId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface WLBrandListResponse {
  items: WhiteLabelBrandDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface WhiteLabelBrandDetailDTO extends WhiteLabelBrandDTO {
  products: WhiteLabelProductDTO[];
  ordersCount: number;
  orders?: WhiteLabelOrderDTO[];
}

export interface WLProductListParams {
  brandId: string;
  wlBrandId: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface WLProductListResponse {
  items: WhiteLabelProductDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateWLBrandInput {
  brandId: string;
  ownerPartnerId?: string;
  ownerAffiliateId?: string;
  name: string;
  slug?: string;
  status?: string;
  settings?: unknown;
}

export interface UpdateWLBrandInput {
  brandId: string;
  name?: string;
  slug?: string;
  status?: string;
  settings?: unknown;
}

export interface CreateWLProductInput {
  brandId: string;
  wlBrandId: string;
  baseProductId?: string;
  name: string;
  sku?: string;
}

export interface CreateWLOrderInput {
  brandId: string;
  wlBrandId: string;
  total: number;
  currency?: string;
  status?: string;
}

export interface UpdateWLOrderStatusInput {
  brandId: string;
  wlBrandId: string;
  newStatus: string;
}

export interface PricingSyncRequestInput {
  brandId: string;
  wlBrandId: string;
  productId: string;
  currentPrice: number;
  targetChannels?: string[];
}
