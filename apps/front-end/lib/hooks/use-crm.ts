"use client";

import { useQuery } from "@tanstack/react-query";
import { listLeads, scoreLead } from "@/lib/api/crm";

export function useLeads(params?: {
  brandId?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["crm-leads", params],
    queryFn: () => listLeads(params),
  });
}

export function useLeadAI(leadId?: string) {
  return useQuery({
    queryKey: ["crm-lead-ai", leadId],
    enabled: Boolean(leadId),
    queryFn: () => scoreLead(leadId!),
  });
}
