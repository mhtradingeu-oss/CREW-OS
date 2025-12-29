"use client";

import { useQuery } from "@tanstack/react-query";
import { getKpiSummary } from "@/lib/api/ai-kpi";

export function useKpiSummary(params: {
  brandId?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  return useQuery({
    queryKey: ["kpi-summary", params],
    queryFn: () => getKpiSummary(params),
    staleTime: 60_000,
  });
}
