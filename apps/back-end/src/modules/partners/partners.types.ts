import type { PaginationParams } from "../../core/utils/pagination.js";

export const PARTNER_USER_ROLES = ["PARTNER_OWNER", "PARTNER_ADMIN", "PARTNER_USER"] as const;
export type PartnerUserRole = (typeof PARTNER_USER_ROLES)[number];

export interface PartnerContractTerms {
  discount?: string;
  reference?: string;
  notes?: string;
  effectiveDate?: string;
  [key: string]: unknown;
}

export interface PartnerPricingMetadata {
  reason?: string;
  source?: string;
  tags?: string[];
  notes?: string;
  [key: string]: unknown;
}

export interface CreatePartnerInput {
  brandId: string;
  type: string;
  name: string;
  country?: string | null;
  city?: string | null;
  tierId?: string | null;
  status?: string | null;
}

export interface UpdatePartnerInput {
  type?: string;
  name?: string;
  country?: string | null;
  city?: string | null;
  tierId?: string | null;
  status?: string | null;
}

export interface PartnerDTO {
  id: string;
  brandId?: string;
  type: string;
  name: string;
  country?: string;
  city?: string;
  status?: string;
  tierId?: string;
  tierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerListParams extends PaginationParams {
  brandId: string;
  search?: string;
  tierId?: string;
  status?: string;
}

export interface PaginatedPartners {
  data: PartnerDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartnerStatsDTO {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalStands: number;
  affiliateLinks: number;
  affiliateRevenue: number;
  whiteLabelRevenue: number;
  lastOrderAt?: Date;
}

export interface PartnerUserListParams extends PaginationParams {
  partnerId: string;
  brandId: string;
}

export interface CreatePartnerUserInput {
  userId?: string;
  email?: string;
  password?: string;
  role?: PartnerUserRole;
}

export interface UpdatePartnerUserInput {
  role?: PartnerUserRole;
}

export interface PartnerUserRecord {
  id: string;
  partnerId: string;
  userId?: string;
  role?: PartnerUserRole;
  userEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedPartnerUsers {
  data: PartnerUserRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartnerDetailDTO extends PartnerDTO {
  contractsCount: number;
  latestContract?: {
    startDate?: Date;
    endDate?: Date;
  };
  pricingCount: number;
  totalOrders: number;
  totalRevenue: number;
}

export interface PartnerContractDTO {
  id: string;
  partnerId: string;
  brandId?: string;
  startDate?: Date;
  endDate?: Date;
  terms?: PartnerContractTerms | string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerContractListParams extends PaginationParams {
  partnerId: string;
  brandId: string;
  onlyActive?: boolean;
}

export interface PartnerContractListResponse {
  data: PartnerContractDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartnerContractCreateInput {
  partnerId: string;
  brandId: string;
  startDate?: string;
  endDate?: string;
  terms?: PartnerContractTerms | string;
}

export interface PartnerContractUpdateInput {
  startDate?: string;
  endDate?: string;
  terms?: PartnerContractTerms | string;
}

export interface PartnerPricingDTO {
  id: string;
  partnerId: string;
  productId: string;
  productName?: string;
  netPrice?: number;
  currency?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PartnerPricingListParams extends PaginationParams {
  partnerId: string;
  brandId: string;
  productId?: string;
}

export interface PartnerPricingListResponse {
  data: PartnerPricingDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PartnerPricingUpsertInput {
  partnerId: string;
  brandId: string;
  productId: string;
  netPrice: number;
  currency?: string;
  metadata?: PartnerPricingMetadata;
}

export interface PartnersEventPayload {
  brandId?: string;
  partnerId?: string;
  action?: "created" | "updated" | "deleted" | string;
  id?: string;
  entityId?: string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
