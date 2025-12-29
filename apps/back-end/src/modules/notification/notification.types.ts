export type NotificationFilters = {
  status?: string;
  brandId?: string;
  type?: string;
  unreadOnly?: boolean;
  page?: number;
  pageSize?: number;
};

export type CreateNotificationInput = {
  userId?: string;
  brandId?: string;
  type?: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  status?: string;
};

export type NotificationRecord = {
  id: string;
  brandId?: string;
  userId?: string;
  type?: string;
  title: string;
  message: string;
  status?: string;
  createdAt: Date;
  readAt?: Date;
  data?: Record<string, unknown>;
};

export type NotificationDeliveryOptions = {
  deliveryChannel?: "email" | "sms";
  recipient?: string;
  templateId?: string;
  templateVariables?: Record<string, unknown>;
  subject?: string;
  body?: string;
};

export interface NotificationCreatedEventPayload {
  notificationId: string;
  brandId?: string;
  userId?: string;
  type?: string;
  channel?: string;
}

export interface NotificationReadEventPayload {
  notificationIds: string[];
  brandId?: string;
  userId?: string;
}
