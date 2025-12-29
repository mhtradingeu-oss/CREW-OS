import { apiFetch } from "./client";

type ApiEnvelope<T> = { success?: boolean; data: T };

export type WhiteLabelPayload = {
  brandId?: string;
  productId?: string;
  baseProductId?: string;
  customDimensions?: { width?: number; height?: number; depth?: number };
  surfaces?: string[];
  logoUrl?: string;
  brandColors?: { primary?: string; secondary?: string; accent?: string };
  style?: string;
  scene?: string;
  prompt?: string;
  engineId?: string;
  count?: number;
  productName?: string;
  description?: string;
  variants?: WhiteLabelPayload[];
};

export async function previewWhiteLabel(payload: WhiteLabelPayload) {
  const { data } = await api.post<ApiEnvelope<any>>("/white-label-configurator/preview", payload);
  return data.data;
}

export async function batchWhiteLabel(payload: WhiteLabelPayload) {
  const { data } = await api.post<ApiEnvelope<any>>("/white-label-configurator/batch", payload);
  return data.data;
}
