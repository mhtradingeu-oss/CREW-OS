// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.
import type { PaginatedResponse } from "./types.ts";

export type SecurityPolicy = {
  id: string;
  key: string;
  category?: string | null;
  status: string;
  rulesJson?: string | null;
  brandId?: string | null;
  updatedAt: string;
};

export type SecurityPolicyList = PaginatedResponse<SecurityPolicy>;

export type RoleRecord = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

export type PermissionRecord = {
  id: string;
  code: string;
  description?: string | null;
};

export type AiRestrictionRecord = {
  id: string;
  name: string;
  rulesJson?: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function listPolicies(params?: {
  brandId?: string;
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await api.get<SecurityPolicyList | { data: SecurityPolicy[]; total: number; page: number; pageSize: number }>(
    "/security/policies",
    { params },
  );
  if ("data" in data) return data;
  return data as SecurityPolicyList;
}

export async function getPolicy(id: string) {
  const { data } = await api.get<SecurityPolicy>(`/security/policies/${id}`);
  return data;
}

export async function createPolicy(payload: Partial<SecurityPolicy> & { key: string }) {
  const { data } = await api.post<SecurityPolicy>("/security/policies", {
    name: payload.key,
    category: payload.category,
    status: payload.status,
    brandId: payload.brandId,
    rulesJson: payload.rulesJson,
  });
  return data;
}

export async function updatePolicy(id: string, payload: Partial<SecurityPolicy>) {
  const { data } = await api.put<SecurityPolicy>(`/security/policies/${id}`,
    {
      name: payload.key,
      category: payload.category,
      status: payload.status,
      brandId: payload.brandId,
      rulesJson: payload.rulesJson,
    },
  );
  return data;
}

export async function deletePolicy(id: string) {
  await api.delete(`/security/policies/${id}`);
  return true;
}

export async function listRoles() {
  const { data } = await api.get<RoleRecord[]>("/security/rbac/roles");
  return data;
}

export async function createRole(payload: { name: string; description?: string; permissions?: string[] }) {
  const { data } = await api.post<RoleRecord>("/security/rbac/roles", payload);
  return data;
}

export async function updateRole(id: string, payload: Partial<{ name: string; description?: string; permissions?: string[] }>) {
  const { data } = await api.put<RoleRecord>(`/security/rbac/roles/${id}`, payload);
  return data;
}

export async function setRolePermissions(id: string, permissions: string[]) {
  const { data } = await api.post<RoleRecord>(`/security/rbac/roles/${id}/permissions`, { permissions });
  return data;
}

export async function listPermissions() {
  const { data } = await api.get<PermissionRecord[]>("/security/rbac/permissions");
  return data;
}

export async function assignRole(payload: { userId: string; role: string; asPrimary?: boolean }) {
  const { data } = await api.post(`/security/rbac/roles/assign`, payload);
  return data as { userId: string; role: string; primary: boolean };
}

export async function revokeRole(payload: { userId: string; role: string }) {
  const { data } = await api.post(`/security/rbac/roles/revoke`, payload);
  return data as { userId: string; role: string };
}

export async function listAiRestrictions() {
  const { data } = await api.get<AiRestrictionRecord[]>("/security/ai/restrictions");
  return data;
}

export async function getAiRestriction(id: string) {
  const { data } = await api.get<AiRestrictionRecord>(`/security/ai/restrictions/${id}`);
  return data;
}

export async function createAiRestriction(payload: { name: string; rulesJson?: string }) {
  const { data } = await api.post<AiRestrictionRecord>("/security/ai/restrictions", payload);
  return data;
}

export async function updateAiRestriction(id: string, payload: { name?: string; rulesJson?: string }) {
  const { data } = await api.put<AiRestrictionRecord>(`/security/ai/restrictions/${id}`, payload);
  return data;
}

export async function deleteAiRestriction(id: string) {
  await api.delete(`/security/ai/restrictions/${id}`);
  return true;
}
