import { z } from "zod";

const parseOptionalDate = z
  .union([z.string(), z.number(), z.date()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value instanceof Date) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("Invalid date");
    }
    return parsed;
  });

export const listTasksQuerySchema = z.object({
  brandId: z.string().min(1),
  status: z.string().optional(),
  dueFrom: parseOptionalDate,
  dueTo: parseOptionalDate,
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const createTaskSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(1),
  status: z.string().optional(),
  dueDate: parseOptionalDate,
});

export const updateTaskSchema = z.object({
  brandId: z.string().min(1),
  title: z.string().min(1).optional(),
  status: z.string().optional(),
  dueDate: z
    .union([z.string(), z.number(), z.date(), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      if (value === null) return null;
      if (value instanceof Date) return value;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("Invalid date");
      }
      return parsed;
    }),
});

export const completeTaskSchema = z.object({
  brandId: z.string().min(1),
});

export const listActivityLogsQuerySchema = z.object({
  brandId: z.string().min(1),
  module: z.string().optional(),
  type: z.string().optional(),
  severity: z.string().optional(),
  dateFrom: parseOptionalDate,
  dateTo: parseOptionalDate,
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
