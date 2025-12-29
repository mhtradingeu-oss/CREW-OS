"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/lib/api/types";
import {
  SalesRepSummaryDto,
  SalesRepDto,
  SalesLeadDto,
  SalesVisitDto,
  SalesRepKpiDto,
  getSalesRep,
  getSalesRepKpis,
  getSalesRepLeads,
  getSalesRepVisits,
  listSalesReps,
} from "@/lib/api/sales-reps";

export function useSalesRepsList(params?: {
  brandId?: string;
  region?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery<PaginatedResponse<SalesRepSummaryDto>>({
    queryKey: ["sales-reps", "list", params],
    queryFn: () => listSalesReps(params),
  });
}

export function useSalesRep(id?: string) {
  return useQuery<SalesRepDto>({
    queryKey: ["sales-reps", "rep", id],
    queryFn: () => getSalesRep(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useSalesRepLeads(id?: string) {
  return useQuery<PaginatedResponse<SalesLeadDto>>({
    queryKey: ["sales-reps", id, "leads"],
    queryFn: () => getSalesRepLeads(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useSalesRepVisits(id?: string) {
  return useQuery<PaginatedResponse<SalesVisitDto>>({
    queryKey: ["sales-reps", id, "visits"],
    queryFn: () => getSalesRepVisits(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useSalesRepKpis(id?: string) {
  return useQuery<SalesRepKpiDto>({
    queryKey: ["sales-reps", id, "kpis"],
    queryFn: () => getSalesRepKpis(id ?? ""),
    enabled: Boolean(id),
  });
}
