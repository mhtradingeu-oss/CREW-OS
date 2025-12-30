import type { NextFunction, Request, Response } from "express";
import { aiReadOnlySnapshotService } from "./ai-read-only.service.js";
import { respondWithSuccess } from "../../../core/http/respond.js";

export async function getSnapshot(req: Request & { context?: { correlationId?: string } }, res: Response, next: NextFunction) {
  try {
    const brandId = typeof req.query.brandId === "string" ? req.query.brandId : undefined;
    const correlationId = req.context?.correlationId;
    const snapshot = await aiReadOnlySnapshotService.fetchSnapshot({ brandId, correlationId });
    respondWithSuccess(res, snapshot);
  } catch (error) {
    next(error);
  }
}
