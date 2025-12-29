// OperationsRepository: Move all prisma queries from operations.service.ts here

import { prisma, type PrismaArgs } from "../../prisma.js";
import { notFound } from '../../http/errors.js';
type OperationsTaskFindManyArgs = PrismaArgs<typeof prisma.operationsTask.findMany>;
type OperationsTaskWhereInput = PrismaArgs<typeof prisma.operationsTask.findMany>["where"];
type OperationsTaskCreateArgs = PrismaArgs<typeof prisma.operationsTask.create>;
type OperationsTaskUpdateArgs = PrismaArgs<typeof prisma.operationsTask.update>;
type ActivityLogFindManyArgs = PrismaArgs<typeof prisma.activityLog.findMany>;
type ActivityLogListResult = [
  number,
  Awaited<ReturnType<typeof prisma.activityLog.findMany>>,
];

export const OperationsRepository = {
  countOpsTasks(where?: OperationsTaskWhereInput) {
    return prisma.operationsTask.count(where ? { where } : undefined);
  },

  listOpsTasks(args: OperationsTaskFindManyArgs) {
    return prisma.operationsTask.findMany(args);
  },

  async createOpsTask(args: OperationsTaskCreateArgs) {
    return prisma.operationsTask.create(args);
  },

  async updateOpsTask(
    id: string,
    brandId: string,
    input: OperationsTaskUpdateArgs["data"],
    select?: OperationsTaskUpdateArgs["select"],
  ) {
    const existing = await prisma.operationsTask.findFirst({
      where: { id, brandId },
      select,
    });
    if (!existing) throw notFound('Operations task not found');

    return prisma.operationsTask.update({
      where: { id },
      data: {
        title: input.title ?? existing.title,
        status: input.status ?? existing.status,
        dueDate: input.dueDate ?? existing.dueDate,
      },
      select,
    });
  },

  async updateOpsTaskStatus(
    id: string,
    brandId: string,
    status: string,
    select?: OperationsTaskUpdateArgs["select"],
  ) {
    const existing = await prisma.operationsTask.findFirst({
      where: { id, brandId },
      select,
    });
    if (!existing) throw notFound('Operations task not found');

    return prisma.operationsTask.update({
      where: { id },
      data: { status },
      select,
    });
  },

  async listActivityLogs(args: ActivityLogFindManyArgs = {}): Promise<ActivityLogListResult> {
    const where = args?.where ?? {};
    const [total, rows] = await prisma.$transaction([
      prisma.activityLog.count({ where }),
      prisma.activityLog.findMany({ ...args, where }),
    ]);

    return [total, rows];
  },
};
