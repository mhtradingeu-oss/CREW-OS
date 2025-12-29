export interface AffiliateTierDTO {
  id: string;
  brandId?: string;
  name: string;
  rules?: string | null;
}

export interface AffiliateStatsDTO {
  totalClicks: number;
  totalOrders: number;
  totalRevenue: number;
  totalCommission: number;
  paidPayouts: number;
  pendingPayouts: number;
}

export interface AffiliateDashboardSummary {
  totalAffiliates: number;
  activeAffiliates: number;
  totalConversions: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
}

export interface AffiliateDTO {
  id: string;
  brandId?: string;
  tierId?: string | null;
  code?: string | null;
  type?: string | null;
  channel?: string | null;
  status?: string | null;
  createdAt: Date;
  updatedAt: Date;
  tier?: AffiliateTierDTO | null;
  stats?: AffiliateStatsDTO;
}

export interface AffiliateListParams {
  brandId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  tierId?: string;
}

export interface AffiliateListResponse {
  items: AffiliateDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AffiliateCreateInput {
  brandId: string;
  tierId?: string;
  code?: string;
  type?: string;
  channel?: string;
  status?: string;
}

export interface AffiliateUpdateInput {
  tierId?: string | null;
  code?: string | null;
  type?: string | null;
  channel?: string | null;
  status?: string | null;
}

export interface AffiliateLinkDTO {
  id: string;
  affiliateId: string;
  linkCode: string;
  targetUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateLinkCreateInput {
  affiliateId: string;
  targetUrl?: string;
}

export interface AffiliateEventPayload {
  brandId?: string;
  affiliateId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}

export type AffiliatePayoutStatus = "PENDING" | "APPROVED" | "REJECTED" | "PAID";

export interface AffiliateConversionDTO {
  id: string;
  brandId?: string;
  affiliateId: string;
  orderId?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliateConversionCreateInput {
  affiliateId: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
}

export interface AffiliateConversionEventPayload {
  brandId?: string;
  affiliateId: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown> | null;
}

export interface AffiliatePayoutRequestInput {
  affiliateId: string;
  amount: number;
  currency?: string;
  method?: string;
  notes?: string;
}

export interface AffiliatePayoutDTO {
  id: string;
  affiliateId: string;
  brandId?: string;
  amount?: number;
  currency?: string;
  status?: AffiliatePayoutStatus;
  method?: string | null;
  notes?: string | null;
  requestedAt: Date;
  resolvedAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AffiliatePayoutStatusEventPayload {
  brandId?: string;
  affiliateId: string;
  payoutId: string;
  amount?: number;
  status?: AffiliatePayoutStatus;
  metadata?: Record<string, unknown> | null;
}

export interface AffiliateActionContext {
  brandId?: string;
  actorUserId?: string;
}
