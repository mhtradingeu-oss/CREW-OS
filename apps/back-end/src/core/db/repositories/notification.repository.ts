// NotificationRepository: Move all prisma queries from notification.service.ts here
import { prisma } from '../../prisma.js';
import type { CreateNotificationInput, NotificationFilters } from '../../../modules/notification/notification.types.js';

export const NotificationRepository = {
  async createNotification(input: CreateNotificationInput) {
    return prisma.notification.create({
      data: {
        brandId: input.brandId ?? null,
        userId: input.userId ?? null,
        type: input.type ?? null,
        channel: "in-app",
        title: input.title,
        body: input.message,
        status: input.status ?? "unread",
        metaJson: null,
        dataJson: input.data ? JSON.stringify(input.data) : null,
      },
    });
  },

  async listForUser(userId: string, filters: NotificationFilters) {
    const {
      status,
      brandId,
      type,
      unreadOnly,
      page = 1,
      pageSize = 20,
    } = filters;
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    const where: any = {
      OR: [{ userId }, { userId: null }],
    };
    if (unreadOnly) {
      where.status = "unread";
    } else if (status) {
      where.status = status;
    }
    if (brandId) where.brandId = brandId;
    if (type) where.type = type;

    const [total, data] = await prisma.$transaction([
      prisma.notification.count({ where }),
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    ]);
    return { data, total };
  },

  async markRead(ids: string[], userId: string) {
    const records = await prisma.notification.findMany({
      where: { id: { in: ids }, OR: [{ userId }, { userId: null }] },
      select: { id: true, brandId: true },
    });
    if (!records.length) {
      return { recordIds: [], brandId: undefined };
    }
    const recordIds = records.map((record) => record.id);
    await prisma.notification.updateMany({
      where: { id: { in: recordIds } },
      data: { status: "read", readAt: new Date() },
    });
    return { recordIds, brandId: records[0]?.brandId ?? undefined };
  },

  async markAllReadForUser(userId: string) {
    const records = await prisma.notification.findMany({
      where: { OR: [{ userId }, { userId: null }], status: { not: "read" } },
      select: { id: true, brandId: true },
    });
    if (!records.length) {
      return { recordIds: [], brandId: undefined };
    }
    const recordIds = records.map((record) => record.id);
    await prisma.notification.updateMany({
      where: { id: { in: recordIds } },
      data: { status: "read", readAt: new Date() },
    });
    return { recordIds, brandId: records[0]?.brandId ?? undefined };
  },
};
