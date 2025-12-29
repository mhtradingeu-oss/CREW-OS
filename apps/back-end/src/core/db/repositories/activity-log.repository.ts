
// ActivityLogRepository: Append-only audit trail for compliance and security.
// All writes are append-only (no update/delete). Each record is immutable.
// logger.* is for operational logs (debug, info, error, etc) and NOT for audit/compliance.
// Audit log records must include: entityType, entityId, correlationId, runId (if relevant), decision/status/reason in metaJson.
import { prisma } from '../../prisma.js';
import type { EventEnvelope } from '../../events/event-bus.js';
import type { ActivityLogFilters, ActivityLogRecord } from '../../../modules/activity-log/activity-log.types.js';
import { buildPagination } from '../../utils/pagination.js';

export const ActivityLogRepository = {
  /**
   * Append a new audit log record. This is the ONLY write method (append-only).
   * @param event EventEnvelope containing payload and context.
   * Required meta fields: entityType, entityId, correlationId, runId (if relevant), decision/status/reason.
   */
  async appendActivity(event: EventEnvelope): Promise<void> {
    const payload = (event.payload ?? {}) as Record<string, unknown>;
    const toStringOrNull = (value: unknown): string | null => (typeof value === "string" ? value : null);
    const toStringOrUndefined = (value: unknown): string | undefined => (typeof value === "string" ? value : undefined);
    const moduleFromPayload = toStringOrUndefined(payload.module);
    const moduleFromContext = toStringOrUndefined(event.context?.module);
    const module = moduleFromPayload ?? moduleFromContext ?? event.name.split(".")[0];
    const actorIdMeta = toStringOrUndefined(payload.actorId) ?? toStringOrUndefined(event.context?.actorUserId);
    const actorRoleMeta = payload.actorRole ?? (event.context && "role" in event.context ? (event.context as Record<string, unknown>).role : undefined);
    const tenantIdMeta = toStringOrUndefined(payload.tenantId) ?? toStringOrUndefined(event.context?.tenantId);
    const brandIdMeta = toStringOrUndefined(payload.brandId) ?? toStringOrUndefined(event.context?.brandId);
    const metaJson = JSON.stringify({
      actorId: actorIdMeta,
      actorRole: actorRoleMeta,
      tenantId: tenantIdMeta,
      brandId: brandIdMeta,
      action: payload.action ?? event.name,
      module,
      entityType: payload.entityType,
      entityId: payload.entityId,
      metadata: payload.metadata ?? payload,
      context: event.context,
      createdAt: payload.createdAt ?? event.occurredAt,
    });
    const brandIdValue = toStringOrNull(payload.brandId) ?? toStringOrNull(event.context?.brandId);
    const userIdValue = toStringOrNull(payload.actorId) ?? toStringOrNull(event.context?.actorUserId);
    const sourceValue = toStringOrUndefined(event.context?.source);
    const severityValue = toStringOrUndefined(event.context?.severity);

    await prisma.activityLog.create({
      data: {
        brandId: brandIdValue,
        userId: userIdValue,
        module,
        type: event.name,
        source: sourceValue ?? "api",
        severity: severityValue ?? "info",
        metaJson,
      },
    });
  },

  async listActivity(filters: ActivityLogFilters = {}): Promise<{ data: ActivityLogRecord[]; total: number; page: number; pageSize: number }> {
    const { brandId, module, userId, type, from, to, page = 1, pageSize = 20 } = filters;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: any = {};
    if (brandId) where.brandId = brandId;
    if (module) where.module = module;
    if (userId) where.userId = userId;
    if (type) where.type = type;
    if (filters.severity) where.severity = filters.severity;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [total, records] = await prisma.$transaction([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      data: records.map((record) => ({
        id: record.id,
        brandId: record.brandId ?? undefined,
        userId: record.userId ?? undefined,
        module: record.module ?? undefined,
        type: record.type,
        source: record.source ?? undefined,
        severity: record.severity ?? undefined,
        meta: record.metaJson
          ? (JSON.parse(record.metaJson) as Record<string, unknown>)
          : undefined,
        createdAt: record.createdAt,
      })),
      total,
      page,
      pageSize: take,
    };
  },

  /**
   * Retrieve audit log records for a given entity (deterministic, append-only).
   * @param entityType
   * @param entityId
   */
  async getActivityByEntity(entityType: string, entityId: string): Promise<ActivityLogRecord[]> {
    const records = await prisma.activityLog.findMany({
      where: {
        AND: [
          {
            metaJson: {
              contains: `"entityType":"${entityType}"`,
            },
          },
          {
            metaJson: {
              contains: `"entityId":"${entityId}"`,
            },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return records.map((record) => ({
      id: record.id,
      brandId: record.brandId ?? undefined,
      userId: record.userId ?? undefined,
      module: record.module ?? undefined,
      type: record.type,
      source: record.source ?? undefined,
      severity: record.severity ?? undefined,
      meta: record.metaJson
        ? (JSON.parse(record.metaJson) as Record<string, unknown>)
        : undefined,
      createdAt: record.createdAt,
    }));
  },
};
