// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.
import type { PaginatedResponse } from "./types.ts";

export interface LeadDto {
  id: string;
  brandId?: string | null;
  status?: string;
  ownerId?: string;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string | null;
  score?: number | null;
  dealCount?: number;
  createdAt: string;
  updatedAt: string;
}

export async function listLeads(params?: Record<string, unknown>): Promise<LeadDto[]> {
  return [];
}

export async function getLead(_id: string): Promise<LeadDto | null> {
  return null;
}

export async function createLead(_payload: Partial<LeadDto> & { brandId?: string; status?: string }): Promise<null> {
  return null;
}

export async function updateLead(id: string, payload: Partial<LeadDto>) {
  const { data } = await api.put<LeadDto>(`/crm/${id}`, payload);
  return data;
}

export async function deleteLead(id: string) {
  await api.delete(`/crm/${id}`);
  return true;
}

export interface LeadAIScoreDto {
  score: number;
  probability: number;
  reasons: string[];
  nextAction: string;
}

export async function scoreLead(
  leadId: string,
  payload?: { intent?: string },
): Promise<LeadAIScoreDto> {
  const { data } = await api.post<LeadAIScoreDto>(`/crm/${leadId}/ai/score`, payload ?? {});
  return data;
}
