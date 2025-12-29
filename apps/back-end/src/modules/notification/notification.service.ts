import type { Prisma } from "@prisma/client";
import { buildPagination } from "../../core/utils/pagination.js";
import { communicationService } from "../communication/communication.service.js";
import { logger } from "../../core/logger.js";
import { emitNotificationCreated, emitNotificationRead } from "./notification.events.js";
import type {
  CreateNotificationInput,
  NotificationDeliveryOptions,
  NotificationFilters,
  NotificationRecord,
} from "./notification.types.js";
import { NotificationRepository } from "../../core/db/repositories/notification.repository.js";


class NotificationService {
  constructor(private readonly repo = NotificationRepository) {}

  async createNotification(input: CreateNotificationInput): Promise<NotificationRecord> {
    const created = await this.repo.createNotification(input);
    await emitNotificationCreated({
      notificationId: created.id,
      brandId: created.brandId ?? undefined,
      userId: created.userId ?? undefined,
      type: created.type ?? undefined,
      channel: created.channel ?? undefined,
    });
    return this.map(created);
  }

  async notifyAndOptionallySend(
    input: CreateNotificationInput & NotificationDeliveryOptions & { brandId?: string },
  ): Promise<NotificationRecord> {
    const notification = await this.createNotification(input);
    if (input.deliveryChannel && input.recipient && input.brandId) {
      try {
        await communicationService.sendMessage({
          brandId: input.brandId,
          channel: input.deliveryChannel,
          recipient: input.recipient,
          templateId: input.templateId,
          subject: input.subject,
          body: input.body,
          variables: input.templateVariables,
        });
      } catch (error) {
        logger.warn(
          `[notification] Delivery to ${input.recipient} via ${input.deliveryChannel} failed: ${
            (error as Error).message
          }`,
        );
      }
    }
    return notification;
  }

  async listForUser(
    userId: string,
    filters: NotificationFilters = {},
  ): Promise<{ data: NotificationRecord[]; total: number; page: number; pageSize: number }> {
    const { page = 1, pageSize = 20 } = filters;
    const { data, total } = await this.repo.listForUser(userId, filters);
    return {
      data: data.map((row: any) => this.map(row)),
      total,
      page,
      pageSize,
    };
  }

  async markRead(ids: string[], userId: string): Promise<void> {
    const { recordIds, brandId } = await this.repo.markRead(ids, userId);
    if (!recordIds.length) return;
    await emitNotificationRead({
      notificationIds: recordIds,
      brandId,
      userId,
    });
  }

  async markAllReadForUser(userId: string): Promise<void> {
    const { recordIds, brandId } = await this.repo.markAllReadForUser(userId);
    if (!recordIds.length) return;
    await emitNotificationRead({
      notificationIds: recordIds,
      brandId,
      userId,
    });
  }

  private map(row: any): NotificationRecord {
    return {
      id: row.id,
      brandId: row.brandId ?? undefined,
      userId: row.userId ?? undefined,
      type: row.type ?? undefined,
      title: row.title,
      message: row.body,
      status: row.status ?? undefined,
      createdAt: row.createdAt,
      readAt: row.readAt ?? undefined,
      data: row.dataJson ? (JSON.parse(row.dataJson) as Record<string, unknown>) : undefined,
    };
  }
}

export const notificationService = new NotificationService();
