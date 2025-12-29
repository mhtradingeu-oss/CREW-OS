"use client";

import { useQuery } from "@tanstack/react-query";
import { listInsights } from "@/lib/api/ai-brain";

export function useAiInsights(params: {
  brandId?: string;
  scope?: string;
  limit?: number;
  periodStart?: string;
  periodEnd?: string;
  sortOrder?: "asc" | "desc";
}) {
  return useQuery({ queryKey: ["ai-insights", params], queryFn: () => listInsights(params) });
}
