import { prisma, type PrismaArgs } from "../../core/prisma.js";
import { OperationsRepository } from "../../core/db/repositories/operations.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import type {
  ActivityLogDTO,
  ActivityLogListParams,
  ActivityLogListResponse,
  CreateOperationsTaskInput,
  OperationsTaskDTO,
  OperationsTaskListParams,
  OperationsTaskListResponse,
  UpdateOperationsTaskInput,
} from "@mh-os/shared";
import { publish } from "../../core/events/event-bus.js";

type OperationsTaskSelect = PrismaArgs<typeof prisma.operationsTask.findMany>["select"];
type OperationsTaskWhereInput = PrismaArgs<typeof prisma.operationsTask.findMany>["where"];
type ActivityLogSelect = PrismaArgs<typeof prisma.activityLog.findMany>["select"];
type ActivityLogWhereInput = PrismaArgs<typeof prisma.activityLog.findMany>["where"];
type TaskRecord = Awaited<ReturnType<typeof prisma.operationsTask.findMany>>[number];
type ActivityLogRecord = Awaited<ReturnType<typeof prisma.activityLog.findMany>>[number];

const taskSelect = {
  id: true,
  brandId: true,
  title: true,
  status: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
} satisfies OperationsTaskSelect;

const activitySelect = {
  id: true,
  brandId: true,
  userId: true,
  module: true,
  type: true,
  source: true,
  severity: true,
  metaJson: true,
  createdAt: true,
} satisfies ActivityLogSelect;

function parseMeta(value: string | null): unknown {
  if (!value) return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function toTaskDTO(record: TaskRecord): OperationsTaskDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    title: record.title,
    status: record.status ?? undefined,
    dueDate: record.dueDate ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function toActivityLogDTO(record: ActivityLogRecord): ActivityLogDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    userId: record.userId ?? undefined,
    module: record.module ?? undefined,
    type: record.type,
    source: record.source ?? undefined,
    severity: record.severity ?? undefined,
    meta: parseMeta(record.metaJson),
    createdAt: record.createdAt,
  };
}

export const operationsService = {
  async listTasks(params: OperationsTaskListParams): Promise<OperationsTaskListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { status, dueFrom, dueTo, search, page = 1, pageSize = 20, brandId } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: OperationsTaskWhereInput = { brandId };
    if (status) where.status = status;
    if (dueFrom || dueTo) {
      where.dueDate = {};
      if (dueFrom) where.dueDate.gte = dueFrom;
      if (dueTo) where.dueDate.lte = dueTo;
    }
    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const [total, rows] = await Promise.all([
      OperationsRepository.countOpsTasks(where),
      OperationsRepository.listOpsTasks({
        where,
        select: taskSelect,
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
    ]);

    return {
      items: rows.map(toTaskDTO),
      total,
      page,
      pageSize: take,
    };
  },

  async createTask(input: CreateOperationsTaskInput): Promise<OperationsTaskDTO> {
    const created = await OperationsRepository.createOpsTask({
      data: {
        brandId: input.brandId,
        title: input.title,
      },
      select: taskSelect,
    });
    logger.info(`[operations] Created task ${created.id} for brand ${input.brandId}`);
    // Emit domain event
    await publish("operations.task.created", { taskId: created.id, brandId: created.brandId, title: created.title });
    // Log to ActivityLog
    await publish("operations.activity.logged", {
      action: "created",
      entityType: "OperationsTask",
      entityId: created.id,
      brandId: created.brandId,
      metadata: { title: created.title }
    });
    return toTaskDTO(created);
  },

  async updateTask(id: string, brandId: string, input: UpdateOperationsTaskInput): Promise<OperationsTaskDTO> {
    const updated = await OperationsRepository.updateOpsTask(id, brandId, input, taskSelect);
    logger.info(`[operations] Updated task ${id}`);
    await publish("operations.activity.logged", {
      action: "updated",
      entityType: "OperationsTask",
      entityId: updated.id,
      brandId: updated.brandId,
      metadata: { ...input }
    });
    return toTaskDTO(updated);
  },

  async completeTask(id: string, brandId: string): Promise<OperationsTaskDTO> {
    const completed = await OperationsRepository.updateOpsTaskStatus(id, brandId, "COMPLETED", taskSelect);
    logger.info(`[operations] Completed task ${id}`);
    await publish("operations.activity.logged", {
      action: "completed",
      entityType: "OperationsTask",
      entityId: completed.id,
      brandId: completed.brandId,
      metadata: {}
    });
    return toTaskDTO(completed);
  },

  async listActivityLogs(params: ActivityLogListParams): Promise<ActivityLogListResponse> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const { module, type, severity, dateFrom, dateTo, page = 1, pageSize = 20, brandId } = params;
    const { skip, take } = buildPagination({ page, pageSize });

    const where: ActivityLogWhereInput = { brandId };
    if (module) where.module = module;
    if (type) where.type = type;
    if (severity) where.severity = severity;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    const [total, rows] = await OperationsRepository.listActivityLogs({
      where,
      select: activitySelect,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    return {
      items: rows.map(toActivityLogDTO),
      total,
      page,
      pageSize: take,
    };
  },
};
