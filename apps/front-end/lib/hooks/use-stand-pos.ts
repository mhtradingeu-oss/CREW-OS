"use client";

import { useQuery } from "@tanstack/react-query";
import {
  StandDetailDto,
  StandListFilters,
  StandPerformanceKpiDto,
  StandDto,
  listStands,
  getStand,
  getStandPerformance,
} from "@/lib/api/stand-pos";

export function useStandsList(params?: StandListFilters) {
  return useQuery({ queryKey: ["stand-pos", "stands", params], queryFn: () => listStands(params) });
}

export function useStand(id?: string) {
  return useQuery<StandDetailDto>({
    queryKey: ["stand-pos", "stand", id],
    queryFn: () => getStand(id ?? ""),
    enabled: Boolean(id),
  });
}

export function useStandPerformance(id?: string) {
  return useQuery<StandPerformanceKpiDto>({
    queryKey: ["stand-pos", "stand-performance", id],
    queryFn: () => getStandPerformance(id ?? ""),
    enabled: Boolean(id),
  });
}
