"use client";

import { useQuery } from "@tanstack/react-query";
import {
  generateCaptions,
  generateMarketingPlan,
  generateSeo,
} from "@/lib/api/marketing-ai";

export function useMarketingPlan(params?: { goal: string; tone?: string; audience?: string }) {
  return useQuery({
    queryKey: ["marketing-plan", params],
    enabled: Boolean(params?.goal),
    queryFn: () => generateMarketingPlan(params!),
  });
}

export function useSEOGenerator(params?: { topic: string; locale?: string }) {
  return useQuery({
    queryKey: ["marketing-seo", params],
    enabled: Boolean(params?.topic),
    queryFn: () => generateSeo(params!),
  });
}

export function useAICaptions(params?: { topic: string; platform?: string; tone?: string }) {
  return useQuery({
    queryKey: ["marketing-captions", params],
    enabled: Boolean(params?.topic),
    queryFn: () => generateCaptions(params!),
  });
}
