"use client";

import { useQuery } from "@tanstack/react-query";
import { listReports } from "@/lib/api/ai-brain";

export function useAiReports(params: {
  brandId?: string;
  scope?: string;
  periodStart?: string;
  periodEnd?: string;
}) {
  return useQuery({ queryKey: ["ai-reports", params], queryFn: () => listReports(params) });
}
