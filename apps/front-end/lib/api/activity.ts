// V1 PLACEHOLDER — EXECUTION DISABLED
// All API logic is disabled for V1 read-only build.
import type { PaginatedResponse } from "./types.ts";

export interface ActivityLogDto {
  id: string;
  brandId?: string;
  userId?: string;
  module?: string;
  type: string;
  source?: string;
  severity?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export async function listActivity(params?: {
  brandId?: string;
  module?: string;
  userId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await api.get<PaginatedResponse<ActivityLogDto>>("/activity", { params });
  return data;
}
