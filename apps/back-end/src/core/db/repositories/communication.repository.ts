import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

const templateSelect = {
  id: true,
  brandId: true,
  code: true,
  channel: true,
  version: true,
  subject: true,
  body: true,
  variablesJson: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.NotificationTemplateSelect;

const templateMetadataSelect = {
  id: true,
  code: true,
  subject: true,
  body: true,
} satisfies Prisma.NotificationTemplateSelect;

const notificationSelect = {
  id: true,
  brandId: true,
  channel: true,
  type: true,
  status: true,
  dataJson: true,
  metaJson: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export type NotificationTemplatePayload = Prisma.NotificationTemplateGetPayload<{ select: typeof templateSelect }>;
export type NotificationMetadataPayload = Prisma.NotificationTemplateGetPayload<{
  select: typeof templateMetadataSelect;
}>;
export type NotificationPayload = Prisma.NotificationGetPayload<{ select: typeof notificationSelect }>;

export type NotificationTemplateWhereInput = Prisma.NotificationTemplateWhereInput;
export type NotificationWhereInput = Prisma.NotificationWhereInput;
export type NotificationTemplateCreateInput = Prisma.NotificationTemplateUncheckedCreateInput;
export type NotificationTemplateUpdateInput = Prisma.NotificationTemplateUpdateInput;
export type NotificationCreateInput = Prisma.NotificationUncheckedCreateInput;

async function listTemplates(where: NotificationTemplateWhereInput, skip: number, take: number) {
  return prisma.$transaction([
    prisma.notificationTemplate.count({ where }),
    prisma.notificationTemplate.findMany({
      where,
      select: templateSelect,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);
}

async function findTemplate(where: NotificationTemplateWhereInput) {
  return prisma.notificationTemplate.findFirst({ where, select: templateSelect });
}

async function findTemplateMetadata(templateId: string) {
  return prisma.notificationTemplate.findUnique({
    where: { id: templateId },
    select: templateMetadataSelect,
  });
}

async function createTemplate(data: NotificationTemplateCreateInput) {
  return prisma.notificationTemplate.create({ data, select: templateSelect });
}

async function updateTemplate(templateId: string, data: NotificationTemplateUpdateInput) {
  return prisma.notificationTemplate.update({ where: { id: templateId }, data, select: templateSelect });
}

async function deleteTemplates(where: NotificationTemplateWhereInput) {
  return prisma.notificationTemplate.deleteMany({ where });
}

async function createNotificationLog(data: NotificationCreateInput) {
  return prisma.notification.create({ data, select: notificationSelect });
}

async function listNotifications(where: NotificationWhereInput, skip: number, take: number) {
  return prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      select: notificationSelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
}

export const communicationRepository = {
  templateSelect,
  notificationSelect,
  listTemplates,
  findTemplate,
  findTemplateMetadata,
  createTemplate,
  updateTemplate,
  deleteTemplates,
  createNotificationLog,
  listNotifications,
};
