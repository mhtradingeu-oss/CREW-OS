

// Pricing API (read-only, presenter layer)
// No business/AI/decision/automation logic. No hooks. No side effects.
// All imports explicit, ESM, alias-based.

import { apiFetch } from '@/lib/api/client';
import type { Pricing, ApiListResponse } from '@/lib/api/types';

export async function listPricing(): Promise<ApiListResponse<Pricing>> {
  return apiFetch<ApiListResponse<Pricing>>('/api/v1/pricing');
}

export async function getPricing(id: string): Promise<Pricing> {
  return apiFetch<Pricing>(`/api/v1/pricing/${id}`);
}

export async function updatePricing(id: string, payload: UpdatePricingInputDto) {
  const { data } = await api.put<PricingRecordDto>(`/pricing/${id}`, payload);
  return data;
}

export async function removePricing(id: string) {
  await api.delete(`/pricing/${id}`);
  return true;
}

export async function getPricingByProduct(productId: string) {
  const { data } = await api.get<PaginatedResponse<PricingRecordDto>>("/pricing", {
    params: { productId, page: 1, pageSize: 1 },
  });
  return data.data[0] ?? null;
}

export async function listDrafts(productId: string) {
  const { data } = await api.get<PaginatedResponse<PricingDraftDto>>(
    `/pricing/product/${productId}/drafts`,
  );
  return data.data;
}

export async function createDraft(productId: string, payload: PricingDraftCreateDto) {
  const { data } = await api.post<PricingDraftDto>(`/pricing/product/${productId}/drafts`, payload);
  return data;
}

export async function listCompetitors(productId: string) {
  const { data } = await api.get<PaginatedResponse<CompetitorPriceDto>>(
    `/pricing/product/${productId}/competitors`,
  );
  return data.data;
}

export async function addCompetitor(productId: string, payload: CompetitorPriceCreateDto) {
  const { data } = await api.post<CompetitorPriceDto>(
    `/pricing/product/${productId}/competitors`,
    payload,
  );
  return data;
}

export async function listLogs(productId: string) {
  const { data } = await api.get<PaginatedResponse<PricingLogEntryDto>>(
    `/pricing/product/${productId}/logs`,
  );
  return data.data;
}

// PricingSuggestionOutputDto is now imported from @mh-os/shared

export async function getAIPricingSuggestion(
  productId: string,
  input?: PricingSuggestionInputDto,
): Promise<PricingSuggestionOutputDto> {
  const { data } = await api.post<PricingSuggestionOutputDto>(
    `/pricing/product/${productId}/ai/suggest`,
    input ?? {},
  );
  const payload = data as PricingSuggestionOutputDto & { suggestionJson?: PricingSuggestionOutputDto };
  return payload.suggestionJson ?? payload;
}

export async function approveDraft(
  productId: string,
  draftId: string,
  payload?: { approvedById?: string },
) {
  const { data } = await api.post<PricingDraftDto>(
    `/pricing/product/${productId}/drafts/${draftId}/approve`,
    payload ?? {},
  );
  return data;
}

export async function rejectDraft(productId: string, draftId: string, payload?: { reason?: string }) {
  const { data } = await api.post<PricingDraftDto>(
    `/pricing/product/${productId}/drafts/${draftId}/reject`,
    payload ?? {},
  );
  return data;
}

export async function aiPlan(productId: string, input?: PricingPlanInputDto) {
  const { data } = await api.post<PricingPlanOutputDto>(`/pricing/product/${productId}/ai/plan`, input ?? {});
  return data;
}
