import type { Request, Response } from "express";
import { env } from "../../../core/config/env.js";
import { respondWithSuccess } from "../../../core/http/respond.js";
import { aiSuggestionsService } from "./ai-suggestions.service.js";
import { aiSuggestionsQuerySchema } from "./ai-suggestions.validators.js";

export async function getSuggestions(req: Request, res: Response) {
  if (!env.AI_SUGGESTIONS_ENABLED) {
    return res.status(503).json({
      status: "error",
      message: "AI suggestions are disabled on this environment.",
    });
  }

  try {
    const params = aiSuggestionsQuerySchema.parse(req.query);
    const correlationId = (req as Request & { context?: { correlationId?: string } }).context?.correlationId;
    const response = await aiSuggestionsService.getSuggestions({
      brandId: params.brandId,
      correlationId,
    });
    respondWithSuccess(res, response);
  } catch {
    res.status(503).json({
      status: "error",
      message: "AI suggestions are temporarily unavailable.",
    });
  }
}
