import type { Response } from "express";

/**
 * Unified success response helper to keep the API shape consistent across controllers.
 */
export function respondWithSuccess(res: Response, data: unknown, status = 200) {
  return res.status(status).json({ success: true, data });
}
