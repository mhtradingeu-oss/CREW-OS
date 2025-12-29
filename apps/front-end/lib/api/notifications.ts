import { apiFetch } from "./client";
import type { PaginatedResponse } from "./types";

export type NotificationStatus = "unread" | "read" | "archived" | string;

export interface NotificationDto {
  id: string;
  brandId?: string;
  userId?: string;
  type?: string;
  title: string;
  message: string;
  status?: NotificationStatus;
  createdAt: string;
  readAt?: string;
}

export async function listNotifications(params?: {
  status?: string;
  brandId?: string;
  type?: string;
  page?: number;
  pageSize?: number;
}) {
  const { data } = await api.get<PaginatedResponse<NotificationDto>>("/notifications", { params });
  return data;
}

export async function markNotificationsRead(ids: string[]) {
  await api.post("/notifications/read", { ids });
}

export async function markAllNotificationsRead() {
  await api.post("/notifications/read-all");
}
