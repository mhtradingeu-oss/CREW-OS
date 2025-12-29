"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listBrands,
  getBrand,
  getBrandIdentity,
  updateBrandIdentity,
  getBrandRules,
  updateBrandRules,
  getBrandAiConfig,
  updateBrandAiConfig,
  refreshBrandRulesAi,
} from "@/lib/api/brand";

export function useBrandList(params?: { search?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["brands", params],
    queryFn: () => listBrands(params),
  });
}

export function useBrand(id?: string) {
  return useQuery({
    queryKey: ["brand", id],
    enabled: Boolean(id),
    queryFn: () => getBrand(id!),
  });
}

export function useBrandIdentity(brandId?: string) {
  return useQuery({
    queryKey: ["brand-identity", brandId],
    enabled: Boolean(brandId),
    queryFn: () => getBrandIdentity(brandId!),
  });
}

export function useRefreshBrandIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    // No-op mutation since refreshBrandAiIdentity is not available
    mutationFn: async (_payload: { brandId: string; forceRegenerate?: boolean }) => {},
    onSuccess: (_data, variables) => {
      if (!variables?.brandId) return;
      queryClient.invalidateQueries({ queryKey: ["brand-identity", variables.brandId] });
    },
  });
}

export function useRefreshBrandRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { brandId: string; forceRegenerate?: boolean }) =>
      refreshBrandRulesAi(payload.brandId, { forceRegenerate: payload.forceRegenerate }),
    onSuccess: (_, variables) => {
      if (!variables?.brandId) return;
      queryClient.invalidateQueries({ queryKey: ["brand-rules", variables.brandId] });
      queryClient.invalidateQueries({ queryKey: ["brand", variables.brandId] });
      queryClient.invalidateQueries({ queryKey: ["ai-insights", { brandId: variables.brandId }] });
    },
  });
}

export function useSaveBrandIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { brandId: string; values: Record<string, unknown> }) =>
      updateBrandIdentity(payload.brandId, payload.values),
    onSuccess: (_, variables) => {
      if (!variables?.brandId) return;
      queryClient.invalidateQueries({ queryKey: ["brand-identity", variables.brandId] });
    },
  });
}

export function useBrandRules(brandId?: string) {
  return useQuery({
    queryKey: ["brand-rules", brandId],
    enabled: Boolean(brandId),
    queryFn: () => getBrandRules(brandId!),
  });
}

export function useSaveBrandRules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { brandId: string; values: Record<string, unknown> }) =>
      updateBrandRules(payload.brandId, payload.values),
    onSuccess: (_, variables) => {
      if (!variables?.brandId) return;
      queryClient.invalidateQueries({ queryKey: ["brand-rules", variables.brandId] });
    },
  });
}

export function useBrandAiConfig(brandId?: string) {
  return useQuery({
    queryKey: ["brand-ai-config", brandId],
    enabled: Boolean(brandId),
    queryFn: () => getBrandAiConfig(brandId!),
  });
}

export function useSaveBrandAiConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { brandId: string; values: Record<string, unknown> }) =>
      updateBrandAiConfig(payload.brandId, payload.values),
    onSuccess: (_, variables) => {
      if (!variables?.brandId) return;
      queryClient.invalidateQueries({ queryKey: ["brand-ai-config", variables.brandId] });
    },
  });
}
