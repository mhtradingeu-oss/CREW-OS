import type { NextFunction, Request, Response } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { parsePagination } from "../../core/http/pagination.js";
import {
  createSalesOrderWithPricingAndInventory as createSalesOrderWithPricingAndInventoryService,
  sales_repsService,
} from "./sales-reps.service.js";
import {
  listSalesLeadsSchema,
  listSalesRepsSchema,
  listSalesVisitsSchema,
  salesRepAiPlanSchema,
} from "./sales-reps.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function createSalesOrderWithPricingAndInventory(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = await createSalesOrderWithPricingAndInventoryService(req.body);
    respondWithSuccess(res, result, 201);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  const validated = listSalesRepsSchema.safeParse(req.query);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const { page, pageSize } = parsePagination(req.query);
    const result = await sales_repsService.list({ ...validated.data, page, pageSize });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const rep = await sales_repsService.getById(id);
    respondWithSuccess(res, rep);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const rep = await sales_repsService.create(req.body);
    respondWithSuccess(res, rep, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const rep = await sales_repsService.update(id, req.body);
    respondWithSuccess(res, rep);
  } catch (err) {
    next(err);
  }
}

export async function listLeads(req: Request, res: Response, next: NextFunction) {
  const validated = listSalesLeadsSchema.safeParse(req.query);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const id = requireParam(req.params.id, "id");
    const { page, pageSize } = parsePagination(req.query);
    const result = await sales_repsService.listLeads(id, { ...validated.data, page, pageSize });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createLead(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const lead = await sales_repsService.createLead(id, req.body);
    respondWithSuccess(res, lead, 201);
  } catch (err) {
    next(err);
  }
}

export async function listVisits(req: Request, res: Response, next: NextFunction) {
  const validated = listSalesVisitsSchema.safeParse(req.query);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const id = requireParam(req.params.id, "id");
    const { page, pageSize } = parsePagination(req.query);
    const result = await sales_repsService.listVisits(id, { ...validated.data, page, pageSize });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function createVisit(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const visit = await sales_repsService.createVisit(id, req.body);
    respondWithSuccess(res, visit, 201);
  } catch (err) {
    next(err);
  }
}

export async function getKpis(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const summary = await sales_repsService.getKpis(id);
    respondWithSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function getAiPlan(req: Request, res: Response, next: NextFunction) {
  const validated = salesRepAiPlanSchema.safeParse(req.body);
  if (!validated.success) {
    return next(badRequest("Validation error", validated.error.flatten()));
  }

  try {
    const id = requireParam(req.params.id, "id");
    const plan = await sales_repsService.getAiPlan(id, validated.data);
    respondWithSuccess(res, plan);
  } catch (err) {
    next(err);
  }
}
