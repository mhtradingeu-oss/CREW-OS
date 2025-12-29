// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.

import { apiFetch } from "./client.ts";
import type { PaginatedResponse } from "./types.ts";

export interface SalesRepSummaryDto {
  id: string;
  brandId?: string;
  userId?: string;
  code?: string;
  region?: string;
  status?: string;
  territoryCount: number;
}

export interface SalesRepTerritoryDto {
  id: string;
  territory?: { id: string; name?: string; country?: string; city?: string };
}

export interface SalesLeadDto {
  id: string;
  repId: string;
  stage?: string;
  status: string;
  source?: string;
  score?: number;
  nextAction?: string;
  createdAt: string;
}

export interface SalesVisitDto {
  id: string;
  repId: string;
  partnerId?: string;
  purpose?: string;
  result?: string;
  date?: string;
  createdAt: string;
}

export interface SalesRepDto extends SalesRepSummaryDto {
  territories?: SalesRepTerritoryDto[];
  leads?: SalesLeadDto[];
  visits?: SalesVisitDto[];
  quotes?: { id: string }[];
  orders?: { id: string }[];
}

export interface SalesRepKpiDto {
  repId: string;
  totalLeads: number;
  totalVisits: number;
  totalOrders: number;
  totalRevenue: number;
  lastUpdated: string;
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

export interface SalesLeadPayload {
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

export interface SalesVisitPayload {
  partnerId?: string;
  date?: string;
  purpose?: string;
  result?: string;
}

export interface SalesRepsListFilters {
  brandId?: string;
  region?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listSalesReps(params?: SalesRepsListFilters) {
  const qs = new URLSearchParams();
  if (params?.brandId) qs.set("brandId", params.brandId);
  if (params?.region) qs.set("region", params.region);
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const { data } = await apiFetch<PaginatedResponse<SalesRepSummaryDto>>(`/sales-reps?${qs.toString()}`);
  return data ?? [];
}

export async function getSalesRep(id: string) {
  const { data } = await apiFetch<SalesRepDto>(`/sales-reps/${id}`);
  return data ?? null;
}

export async function getSalesRepLeads(
  id: string,
  params?: { status?: string; page?: number; pageSize?: number },
) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const { data } = await apiFetch<PaginatedResponse<SalesLeadDto>>(`/sales-reps/${id}/leads?${qs.toString()}`);
  return data ?? [];
}

export async function createSalesRepLead(id: string, payload: SalesLeadPayload): Promise<null> {
  return null;
}

export async function getSalesRepVisits(id: string, params?: { page?: number; pageSize?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  const { data } = await apiFetch<PaginatedResponse<SalesVisitDto>>(`/sales-reps/${id}/visits?${qs.toString()}`);
  return data ?? [];
}

export async function createSalesRepVisit(id: string, payload: SalesVisitPayload): Promise<null> {
  return null;
}

export async function getSalesRepKpis(id: string) {
  const { data } = await apiFetch<SalesRepKpiDto>(`/sales-reps/${id}/kpis`);
  return data ?? null;
}

export async function getSalesRepAiPlan(
  id: string,
  _payload?: { brandId?: string; scope?: string; notes?: string },
) {
  return null;
}
