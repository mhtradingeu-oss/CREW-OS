"use client";

import { useQuery } from "@tanstack/react-query";
import { getProductInsight } from "@/lib/api/product";

export function useProductInsight(productId?: string) {
  return useQuery({
    queryKey: ["product-insight", productId],
    enabled: Boolean(productId),
    queryFn: () => getProductInsight(productId!),
  });
}
