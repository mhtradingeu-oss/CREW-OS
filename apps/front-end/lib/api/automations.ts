// V1 READ-ONLY — AUTOMATIONS API
// All mutations are disabled. GET only.

import { apiFetch } from "./client";
import type { PaginatedResponse } from "./types";

export type AutomationTriggerType = "event" | "schedule";

export interface AutomationRuleDto {
  id: string;
  brandId?: string;
  name: string;
  description?: string;
  triggerType: AutomationTriggerType;
  triggerEvent?: string;
  triggerConfig?: Record<string, unknown>;
  conditionConfig?: Record<string, unknown>;
  actions: { type: string; params?: Record<string, unknown> }[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt?: string;
  lastRunStatus?: string;
}

/**
 * V1: List automations (GET only)
 */
export async function listAutomations(params?: {
  brandId?: string;
  page?: number;
  pageSize?: number;
}): Promise<AutomationRuleDto[]> {
  const qs = new URLSearchParams();
  if (params?.brandId) qs.set("brandId", params.brandId);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch<PaginatedResponse<AutomationRuleDto>>(`/automation?${qs.toString()}`);
  return data?.items ?? [];
}

/**
 * V1: Get single automation
 */
export async function getAutomation(id: string): Promise<AutomationRuleDto | null> {
  // V1 READ-ONLY: Only GET is supported
  const { data } = await apiFetch<AutomationRuleDto>(`/automation/${id}`);
  return data ?? null;
}

/* =========================
   🚫 MUTATIONS DISABLED (V1)
   ========================= */



// V1 READ-ONLY STUB: Mutations are disabled
export async function createAutomation(_: Partial<AutomationRuleDto>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function updateAutomation(_: string, __: Partial<AutomationRuleDto>): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function runAutomation(_: string): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}

export async function runScheduledAutomations(): Promise<null> {
  // V1 READ-ONLY STUB
  return null;
}
