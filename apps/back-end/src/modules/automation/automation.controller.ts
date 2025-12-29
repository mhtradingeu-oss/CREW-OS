import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { publishActivity } from "../../core/activity/activity.js";
import { automationService } from "./automation.service.js";
import { createAutomationSchema, updateAutomationSchema } from "./automation.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { parsePagination } from "../../core/http/pagination.js";

export async function list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const { page, pageSize } = parsePagination(req.query);
    const items = await automationService.list({
      brandId: req.query.brandId as string | undefined,
      page,
      pageSize,
    });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await automationService.getById(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createAutomationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "validation_error", message: "Validation error", details: parsed.error.flatten() });
    }
    // PolicyGate: pre-save validation
    const policyViolations = automationService.policyGatePreSave({
      ruleVersion: parsed.data,
      userRole: req.user?.role,
    });
    if (policyViolations.length) {
      return res.status(400).json({ code: "policy_gate_failed", message: "PolicyGate failed", details: policyViolations });
    }
    await automationService.create({ ...parsed.data, createdById: req.user?.id });
    respondWithSuccess(res, { status: "created" }, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const parsed = updateAutomationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ code: "validation_error", message: "Validation error", details: parsed.error.flatten() });
    }
    const id = requireParam(req.params.id, "id");
    // ActivationGate: pre-activate validation (simulate, as update may trigger activation)
      const activationViolations = automationService.activationGatePreActivate({
        ruleVersion: parsed.data,
        policyStatus: "ok", // TODO: wire real policy status if available
        permissions: [],
      });
    if (activationViolations.length) {
      return res.status(400).json({ code: "activation_gate_failed", message: "ActivationGate failed", details: activationViolations });
    }
    await automationService.update(id, {
      ...parsed.data,
      createdById: req.user?.id,
    });
    respondWithSuccess(res, { status: "updated" });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await automationService.remove(id);
    await publishActivity(
      "automation",
      "deleted",
      {
        entityType: "automation-rule",
        entityId: id,
      },
      {
        actorUserId: req.user?.id,
        role: req.user?.role,
        tenantId: req.user?.tenantId,
        brandId: req.user?.brandId,
        source: "api",
      },
    );
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function runScheduled(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await automationService.runScheduled(new Date());
    await publishActivity("automation", "run_scheduled", { entityType: "automation-schedule" }, { source: "system" });
    respondWithSuccess(res, { status: "scheduled" }, 200);
  } catch (err) {
    next(err);
  }
}

export async function runNow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await automationService.runRule(id, {
      actorUserId: req.user?.id,
      role: req.user?.role,
      tenantId: req.user?.tenantId,
      brandId: req.user?.brandId,
      source: "api",
    });
    respondWithSuccess(res, { id, status: "executed" });
  } catch (err) {
    next(err);
  }
}
