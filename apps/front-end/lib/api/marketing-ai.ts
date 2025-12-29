import { apiFetch } from "./client";

export interface MarketingPlanDto {
  headline: string;
  body: string;
  cta?: string;
  keywords?: string[];
  tone?: string;
}

export interface MarketingSeoDto {
  title: string;
  keywords: string[];
  description: string;
}

export interface MarketingCaptionsDto {
  captions: string[];
}

export async function generateMarketingPlan(payload: {
  goal: string;
  tone?: string;
  audience?: string;
}) {
  const { data } = await api.post<MarketingPlanDto>("/marketing/ai/generate", payload);
  return data;
}

export async function generateSeo(payload: { topic: string; locale?: string }) {
  const { data } = await api.post<MarketingSeoDto>("/marketing/ai/seo", payload);
  return data;
}

export async function generateCaptions(payload: {
  topic: string;
  platform?: string;
  tone?: string;
}) {
  const { data } = await api.post<MarketingCaptionsDto>("/marketing/ai/captions", payload);
  return data;
}
