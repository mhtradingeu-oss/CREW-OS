import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import type { PipelineActor } from "../../core/ai/pipeline/pipeline-types.js";
import { PERMISSIONS } from "../../core/security/permission-registry.js";
import { einvoiceService } from "./einvoice.service.js";
import {
  generateEInvoiceSchema,
  sendEInvoiceSchema,
  validateEInvoiceSchema,
} from "./einvoice.validators.js";

function toActor(req: Request): PipelineActor | undefined {
  if (!req.user) return undefined;
  return {
    userId: req.user.id,
    role: req.user.role,
    permissions: [PERMISSIONS.AI_CONTEXT.FINANCE],
    brandId: req.user.brandId ?? undefined,
    tenantId: req.user.tenantId ?? undefined,
  };
}

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = generateEInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await einvoiceService.generate(parsed.data, toActor(req));
    // AUDIT: log e-invoice generation
    if (req.feature?.audit) {
      // Replace with canonical audit emitter if available
      console.log("AUDIT", { action: "generate_einvoice", user: req.user?.id, invoiceId: parsed.data.invoiceId });
    }
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function validate(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = validateEInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await einvoiceService.validate(parsed.data, toActor(req));
    // AUDIT: log e-invoice validation
    if (req.feature?.audit) {
      console.log("AUDIT", { action: "validate_einvoice", user: req.user?.id, invoiceId: parsed.data.invoiceId });
    }
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function send(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = sendEInvoiceSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const result = await einvoiceService.send(parsed.data, toActor(req));
    // AUDIT: log e-invoice send
    if (req.feature?.audit) {
      console.log("AUDIT", { action: "send_einvoice", user: req.user?.id, invoiceId: parsed.data.invoiceId });
    }
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getByInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoiceId = requireParam(req.params.invoiceId, "invoiceId");
    const format = req.query.format ? String(req.query.format) : undefined;
    const record = await einvoiceService.getByInvoice(invoiceId, format as any);
    respondWithSuccess(res, record);
  } catch (err) {
    next(err);
  }
}
