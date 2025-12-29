import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { badRequest, unauthorized } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { notificationService } from "./notification.service.js";
import { listNotificationsSchema, markReadSchema } from "./notification.validators.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(unauthorized());
    const parsed = listNotificationsSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const items = await notificationService.listForUser(req.user.id, parsed.data);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(unauthorized());
    const parsed = markReadSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    await notificationService.markRead(parsed.data.ids, req.user.id);
    respondWithSuccess(res, { updated: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) return next(unauthorized());
    await notificationService.markAllReadForUser(req.user.id);
    respondWithSuccess(res, { updated: true });
  } catch (err) {
    next(err);
  }
}
