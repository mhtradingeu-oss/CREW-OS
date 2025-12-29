export interface ListNotificationTemplateParams {
  channel?: string;
  active?: boolean;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface NotificationTemplateDTO {
  id: string;
  brandId?: string;
  code: string;
  channel: string;
  subject?: string | null;
  body?: string | null;
  variables?: Record<string, unknown> | null;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedNotificationTemplates {
  items: NotificationTemplateDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateNotificationTemplateInput {
  code: string;
  channel: string;
  subject?: string;
  body?: string;
  variables?: Record<string, unknown>;
}

export interface UpdateNotificationTemplateInput {
  channel?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, unknown>;
  isActive?: boolean;
}

export interface SendMessageInput {
  brandId: string;
  channel: "email" | "sms" | string;
  recipient: string;
  templateId?: string;
  subject?: string;
  body?: string;
  variables?: Record<string, unknown>;
}

export interface CommunicationMessageEventPayload {
  brandId: string;
  channel: string;
  recipient: string;
  templateId?: string;
  status: string;
  error?: string | null;
}

export interface CreateNotificationLogInput {
  brandId: string;
  templateId?: string;
  channel: string;
  recipient: string;
  status: "SENT" | "FAILED" | string;
  errorMessage?: string;
  payload?: Record<string, unknown>;
}

export interface NotificationLogDTO {
  id: string;
  brandId?: string;
  templateId?: string;
  channel: string;
  status?: string;
  recipient?: string;
  error?: string;
  payload?: Record<string, unknown>;
  createdAt: Date;
}

export interface ListNotificationLogParams {
  channel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CommunicationEventPayload {
  brandId?: string;
  entityType?: string;
  entityId?: string;
  templateId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
