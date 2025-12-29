export interface SalesRepListFilters {
  brandId?: string;
  region?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesRepListItem {
  id: string;
  brandId?: string;
  userId?: string;
  code?: string;
  region?: string;
  status?: string;
  territoryCount: number;
}

export interface SalesRepListResult {
  items: SalesRepListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesRepCreateInput {
  brandId?: string;
  userId?: string;
  code?: string;
  region?: string;
  status?: string;
}

export interface SalesRepUpdateInput extends Partial<SalesRepCreateInput> {}

export interface SalesLeadInput {
  leadId?: string;
  companyId?: string;
  territoryId?: string;
  source?: string;
  score?: number;
  stage?: string;
  status?: string;
  nextAction?: string;
  notes?: string;
}

export interface SalesVisitInput {
  partnerId?: string;
  date?: string;
  purpose?: string;
  result?: string;
}

export interface SalesLeadRecord {
  id: string;
  repId: string;
  stage?: string;
  status: string;
  source?: string;
  score?: number;
  nextAction?: string;
  createdAt: Date;
}

export interface SalesVisitRecord {
  id: string;
  repId: string;
  partnerId?: string;
  date?: Date;
  purpose?: string;
  result?: string;
  createdAt: Date;
}

export interface SalesKpiSummary {
  repId: string;
  totalLeads: number;
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  lastUpdated: Date;
}

export interface SalesVisitListFilters {
  page?: number;
  pageSize?: number;
}

export interface SalesLeadListFilters {
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface SalesLeadListResult {
  items: SalesLeadRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesVisitListResult {
  items: SalesVisitRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SalesRepsEventPayload {
  id: string;
}

export interface SalesRepAiPlanRequest {
  brandId?: string;
  scope?: string;
  notes?: string;
}

export interface SalesRepAiPlanDto {
  prioritizedLeads: Array<{
    leadId: string;
    name?: string;
    stage?: string;
    score?: number;
    reason: string;
  }>;
  suggestedActions: Array<{
    leadId?: string;
    type: string;
    description: string;
  }>;
  emailTemplates?: Array<{
    leadId?: string;
    subject: string;
    body: string;
  }>;
  summary: string;
}

export interface SalesPlanEventPayload {
  repId: string;
  brandId?: string;
  leadIds: string[];
  taskCount: number;
  summary?: string;
}

export interface SalesActivityEventPayload {
  brandId?: string;
  salesRepId: string;
  leadId?: string;
  customerId?: string;
  summary: string;
}

export interface SalesOrderEventPayload {
  orderId: string;
  brandId?: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  invoiceId?: string;
  revenueRecordId?: string;
}
