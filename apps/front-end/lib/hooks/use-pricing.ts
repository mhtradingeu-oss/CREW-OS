"use client";

import { useQuery } from "@tanstack/react-query";
import { getPricing, getPricingByProduct, getAIPricingSuggestion } from "@/lib/api/pricing";

export function usePricing({
  productId,
  pricingId,
}: {
  productId?: string;
  pricingId?: string;
}) {
  const key = pricingId ?? productId;
  return useQuery({
    queryKey: ["pricing", key],
    enabled: Boolean(key),
    queryFn: () =>
      pricingId
        ? getPricing(pricingId)
        : productId
        ? getPricingByProduct(productId)
        : Promise.reject(new Error("pricingId or productId is required")),
  });
}

export function useAIPricingSuggestion(productId?: string, strategy?: string) {
  return useQuery({
    queryKey: ["pricing-ai", productId, strategy],
    enabled: Boolean(productId),
    queryFn: () => getAIPricingSuggestion(productId!, strategy ? { strategy } : undefined),
  });
}
