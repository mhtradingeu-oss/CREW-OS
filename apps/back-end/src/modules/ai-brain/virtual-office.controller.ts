import type { NextFunction, Request, Response } from "express";
import { virtualOfficeService } from "./virtual-office.service.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function startMeeting(req: Request, res: Response, next: NextFunction) {
  try {
    const meeting = await virtualOfficeService.runMeeting(req.body);
    respondWithSuccess(res, meeting);
  } catch (err) {
    next(err);
  }
}

export async function listDepartments(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, virtualOfficeService.listDepartments());
  } catch (err) {
    next(err);
  }
}

export async function listActionItems(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.query.brandId as string | undefined;
    const items = await virtualOfficeService.listActionItems(brandId);
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}
