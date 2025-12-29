import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { operationsService } from "./operations.service.js";
import type { UpdateOperationsTaskInput } from "./operations.types.js";
import {
  listTasksQuerySchema,
  createTaskSchema,
  updateTaskSchema,
  completeTaskSchema,
  listActivityLogsQuerySchema,
} from "./operations.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
export async function listTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listTasksQuerySchema.parse(req.query);
    const payload = await operationsService.listTasks(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createTaskSchema.parse(req.body);
    const task = await operationsService.createTask(payload);
    respondWithSuccess(res, task, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = updateTaskSchema.parse(req.body);
    const { brandId, ...data } = payload;
    const task = await operationsService.updateTask(
      requireParam(req.params.id, "id"),
      brandId,
      data as UpdateOperationsTaskInput,
    );
    respondWithSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

export async function completeTask(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = completeTaskSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const task = await operationsService.completeTask(id, payload.brandId);
    respondWithSuccess(res, task);
  } catch (err) {
    next(err);
  }
}

export async function listActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listActivityLogsQuerySchema.parse(req.query);
    const payload = await operationsService.listActivityLogs(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}
