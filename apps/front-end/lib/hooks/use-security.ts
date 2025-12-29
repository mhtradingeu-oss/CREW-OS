"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assignRole,
  createAiRestriction,
  createPolicy,
  createRole,
  deleteAiRestriction,
  deletePolicy,
  getAiRestriction,
  getPolicy,
  listAiRestrictions,
  listPermissions,
  listPolicies,
  listRoles,
  revokeRole,
  setRolePermissions,
  updateAiRestriction,
  updatePolicy,
  updateRole,
} from "@/lib/api/security";

export function usePolicies(filters?: { brandId?: string; category?: string; status?: string; search?: string }) {
  return useQuery({
    queryKey: ["security-policies", filters],
    queryFn: () => listPolicies(filters),
  });
}

export function usePolicy(id?: string) {
  return useQuery({
    queryKey: ["security-policy", id],
    enabled: Boolean(id),
    queryFn: () => getPolicy(id!),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ["security-roles"], queryFn: () => listRoles() });
}

export function usePermissions() {
  return useQuery({ queryKey: ["security-permissions"], queryFn: () => listPermissions() });
}

export function useAiRestrictions() {
  return useQuery({ queryKey: ["ai-restrictions"], queryFn: () => listAiRestrictions() });
}

export function useAiRestriction(id?: string) {
  return useQuery({
    queryKey: ["ai-restriction", id],
    enabled: Boolean(id),
    queryFn: () => getAiRestriction(id!),
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-policies"] }),
  });
}

export function useUpdatePolicy(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updatePolicy>[1]) => updatePolicy(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-policy", id] });
      queryClient.invalidateQueries({ queryKey: ["security-policies"] });
    },
  });
}

export function useDeletePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-policies"] }),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-roles"] }),
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof updateRole>[1]) => updateRole(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-roles"] });
    },
  });
}

export function useSetRolePermissions(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (permissions: string[]) => setRolePermissions(id, permissions),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-roles"] }),
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: assignRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-roles"] }),
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: revokeRole,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["security-roles"] }),
  });
}

export function useCreateAiRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAiRestriction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-restrictions"] }),
  });
}

export function useUpdateAiRestriction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name?: string; rulesJson?: string }) => updateAiRestriction(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-restriction", id] });
      queryClient.invalidateQueries({ queryKey: ["ai-restrictions"] });
    },
  });
}

export function useDeleteAiRestriction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAiRestriction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ai-restrictions"] }),
  });
}
