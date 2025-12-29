/**
 * COMMUNICATION SERVICE — MH-OS v2
 * Spec: docs/ai/30_notification-os.md (MASTER_INDEX)
 */
import { communicationRepository } from "../../core/db/repositories/communication.repository.js";
import type {
  NotificationMetadataPayload,
  NotificationPayload,
  NotificationTemplatePayload,
  NotificationTemplateWhereInput,
  NotificationWhereInput,
} from "../../core/db/repositories/communication.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import type {
  CreateNotificationLogInput,
  CreateNotificationTemplateInput,
  ListNotificationLogParams,
  ListNotificationTemplateParams,
  NotificationLogDTO,
  NotificationTemplateDTO,
  PaginatedNotificationTemplates,
  SendMessageInput,
  UpdateNotificationTemplateInput,
} from "./communication.types.js";
import {
  emitCommunicationMessageFailed,
  emitCommunicationMessageSent,
} from "./communication.events.js";

function parseJSON(value?: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

type NotificationDriverResult = {
  success: boolean;
  message: string;
  error?: string | null;
};

function renderTemplate(text: string | null | undefined, variables?: Record<string, unknown>) {
  if (!text) return null;
  if (!variables) return text;
  return text.replace(/\{\{([^}]+)\}\}/g, (_match, token) => {
    const key = token.trim();
    const value = variables[key];
    if (value === undefined || value === null) return "";
    return String(value);
  });
}

async function sendEmailStub(payload: { to: string; subject?: string | null; body?: string | null }): Promise<NotificationDriverResult> {
  logger.info(`[communication] [email stub] To:${payload.to} Subject:${payload.subject}`);
  return { success: true, message: "email.delivered" };
}

async function sendSmsStub(payload: { to: string; body?: string | null }): Promise<NotificationDriverResult> {
  logger.info(`[communication] [sms stub] To:${payload.to}`);
  return { success: true, message: "sms.delivered" };
}

function templateToDTO(record: NotificationTemplatePayload): NotificationTemplateDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    code: record.code,
    channel: record.channel,
    subject: record.subject,
    body: record.body,
    variables: parseJSON(record.variablesJson),
    isActive: record.isActive,
    version: record.version,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  } as NotificationTemplateDTO;
}

export const communicationService = {
  async listTemplates(
    brandId: string,
    params: ListNotificationTemplateParams = {},
  ): Promise<PaginatedNotificationTemplates> {
    const { channel, active, search, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: NotificationTemplateWhereInput = {
      brandId,
    };

    if (channel) where.channel = channel;
    if (typeof active === "boolean") where.isActive = active;
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { subject: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, rows] = await communicationRepository.listTemplates(where, skip, take);

    return {
      items: rows.map((item: any) => templateToDTO(item)),
      total,
      page,
      pageSize: take,
    };
  },

  async getTemplateById(brandId: string, templateId: string): Promise<NotificationTemplateDTO> {
    const template = await communicationRepository.findTemplate({ id: templateId, brandId });
    if (!template) throw notFound("Template not found");
    return templateToDTO(template);
  },

  async createTemplate(
    brandId: string,
    input: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplateDTO> {
    const existing = await communicationRepository.findTemplate({ brandId, code: input.code });
    if (existing) {
      throw badRequest("Template code already exists for this brand");
    }

    const created = await communicationRepository.createTemplate({
      brandId,
      code: input.code,
      channel: input.channel,
      subject: input.subject ?? null,
      body: input.body ?? null,
      variablesJson: input.variables ? JSON.stringify(input.variables) : null,
    });

    logger.info(`[communication] Created template ${created.code} for brand ${brandId}`);

    return templateToDTO(created);
  },

  async updateTemplate(
    brandId: string,
    templateId: string,
    input: UpdateNotificationTemplateInput,
  ): Promise<NotificationTemplateDTO> {
    const existing = await communicationRepository.findTemplate({ id: templateId, brandId });
    if (!existing) throw notFound("Template not found");

    const updated = await communicationRepository.updateTemplate(templateId, {
      channel: input.channel ?? existing.channel,
      subject: input.subject ?? existing.subject,
      body: input.body ?? existing.body,
      variablesJson:
        input.variables !== undefined ? JSON.stringify(input.variables) : existing.variablesJson,
      isActive: input.isActive ?? existing.isActive,
    });

    return templateToDTO(updated);
  },

  async removeTemplate(brandId: string, templateId: string): Promise<void> {
    const deleted = await communicationRepository.deleteTemplates({
      id: templateId,
      brandId,
    });
    if (!deleted.count) throw notFound("Template not found");
  },

  async recordNotificationSend(input: CreateNotificationLogInput) {
    const template: NotificationMetadataPayload | null = input.templateId
      ? await communicationRepository.findTemplateMetadata(input.templateId)
      : null;

    const title = template?.subject ?? input.channel;
    const body = template?.body ?? input.channel;
    const log = await communicationRepository.createNotificationLog({
      brandId: input.brandId,
      channel: input.channel,
      type: template?.code ?? null,
      title,
      body,
      status: input.status ?? "SENT",
      dataJson: JSON.stringify({ recipient: input.recipient, ...input.payload }),
      metaJson: JSON.stringify({
        error: input.errorMessage ?? null,
        templateId: input.templateId ?? null,
      }),
    });

    logger.info(`[communication] Logged ${input.channel} notification for ${input.recipient}`);

    const payload = parseJSON(log.dataJson);
    const meta = parseJSON(log.metaJson);

    return {
      id: log.id,
      brandId: log.brandId ?? undefined,
      templateId: meta?.templateId ?? undefined,
      channel: log.channel,
      status: log.status ?? undefined,
      recipient: payload?.recipient ?? undefined,
      error: meta?.error ?? undefined,
      payload,
      createdAt: log.createdAt,
    } satisfies NotificationLogDTO;
  },

  async sendMessage(input: SendMessageInput): Promise<NotificationLogDTO> {
    const template =
      input.templateId && input.channel
        ? await communicationRepository.findTemplate({
            id: input.templateId,
            brandId: input.brandId,
            channel: input.channel,
          })
        : null;

    const variables = input.variables ?? {};
    const subject =
      input.subject ??
      renderTemplate(template?.subject ?? null, variables) ??
      (input.channel === "email" ? "No subject" : undefined);
    const body =
      input.body ??
      renderTemplate(template?.body ?? null, variables) ??
      "No body provided";

    const driverResult =
      input.channel === "sms"
        ? await sendSmsStub({ to: input.recipient, body })
        : await sendEmailStub({ to: input.recipient, subject, body });

    const status = driverResult.success ? "SENT" : "FAILED";
    const errorMessage = driverResult.success ? undefined : driverResult.error ?? "delivery.failed";

    const log = await this.recordNotificationSend({
      brandId: input.brandId,
      channel: input.channel,
      recipient: input.recipient,
      templateId: template?.id,
      status,
      errorMessage,
      payload: {
        subject: subject ?? null,
        body,
        variables,
      },
    });

    const eventPayload = {
      brandId: input.brandId,
      channel: input.channel,
      recipient: input.recipient,
      templateId: template?.id ?? undefined,
      status,
      error: driverResult.success ? null : errorMessage,
    };

    if (driverResult.success) {
      await emitCommunicationMessageSent(eventPayload, {
        brandId: input.brandId,
        module: "communication",
      });
    } else {
      await emitCommunicationMessageFailed(eventPayload, {
        brandId: input.brandId,
        module: "communication",
      });
    }

    return log;
  },

  async listNotificationLogs(
    brandId: string,
    params: ListNotificationLogParams = {},
  ): Promise<{ items: NotificationLogDTO[]; total: number; page: number; pageSize: number }> {
    const { channel, status, startDate, endDate, page = 1, pageSize = 20 } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: NotificationWhereInput = { brandId };

    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, rows] = await communicationRepository.listNotifications(where, skip, take);

    const items = rows.map((row: any) => {
      const payload = parseJSON(row.dataJson);
      const meta = parseJSON(row.metaJson);
      return {
        id: row.id,
        brandId: row.brandId ?? undefined,
        channel: row.channel,
        templateId: meta?.templateId ?? undefined,
        status: row.status ?? undefined,
        recipient: payload?.recipient ?? undefined,
        error: meta?.error ?? undefined,
        payload,
        createdAt: row.createdAt,
      };
    });

    return {
      items,
      total,
      page,
      pageSize: take,
    };
  },
};
