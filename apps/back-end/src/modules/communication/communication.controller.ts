import type { Request, Response, NextFunction } from "express";
import { badRequest, unauthorized } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { resolveScopedBrandId } from "../../core/security/multitenant.js";
import { communicationService } from "./communication.service.js";
import type { ListNotificationTemplateParams } from "./communication.types.js";
import {
  createCommunicationSchema,
  sendMessageSchema,
  updateCommunicationSchema,
} from "./communication.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

function resolveBrandId(req: Request) {
  const brandId =
    (req.query.brandId as string | undefined) ?? (req.body.brandId as string | undefined);
  if (!brandId || !brandId.trim()) {
    throw badRequest("brandId is required");
  }
  return brandId;
}

function parseBooleanParam(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

function parseNumberParam(value: string | undefined) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = resolveBrandId(req);
    const params: ListNotificationTemplateParams = {
      channel: req.query.channel as string | undefined,
      active: parseBooleanParam(req.query.active as string | undefined),
      search: req.query.search as string | undefined,
      page: parseNumberParam(req.query.page as string | undefined),
      pageSize: parseNumberParam(req.query.pageSize as string | undefined),
    };
    const items = await communicationService.listTemplates(brandId, params);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = resolveBrandId(req);
    const id = requireParam(req.params.id, "id");
    const item = await communicationService.getTemplateById(brandId, id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createCommunicationSchema.parse(req.body);
    const item = await communicationService.createTemplate(payload.brandId, {
      code: payload.code,
      channel: payload.channel,
      subject: payload.subject,
      body: payload.body,
      variables: payload.variables,
    });
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const payload = updateCommunicationSchema.parse(req.body);
    const item = await communicationService.updateTemplate(payload.brandId, id, {
      channel: payload.channel,
      subject: payload.subject,
      body: payload.body,
      variables: payload.variables,
      isActive: payload.isActive,
    });
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = resolveBrandId(req);
    const id = requireParam(req.params.id, "id");
    await communicationService.removeTemplate(brandId, id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

function resolveBrandContext(req: AuthenticatedRequest) {
  const brandId = resolveScopedBrandId(
    { brandId: req.user?.brandId, role: req.user?.role },
    (req.body.brandId as string | undefined) ?? (req.query.brandId as string | undefined),
  );
  if (!brandId) throw badRequest("brandId is required");
  return brandId;
}

export async function sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return next(unauthorized());
    }
    const brandId = resolveBrandContext(req);
    const payload = sendMessageSchema.parse({ ...req.body, brandId });
    const log = await communicationService.sendMessage(payload);
    respondWithSuccess(res, log, 201);
  } catch (err) {
    next(err);
  }
}
