import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { requireParam } from "../../core/http/params.js";
import { parsePagination } from "../../core/http/pagination.js";
import { social_intelligenceService } from "./social-intelligence.service.js";
import {
  aiSummarySchema,
  influencerSchema,
  listCompetitorReportsSchema,
  listInfluencersSchema,
  listMentionsSchema,
  listTrendsSchema,
  trendSchema,
} from "./social-intelligence.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";

export async function listMentions(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listMentionsSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const { page, pageSize } = parsePagination(req.query);
    const items = await social_intelligenceService.listMentions({ ...parsed.data, page, pageSize });
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getMention(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await social_intelligenceService.getMention(id);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function listInfluencers(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listInfluencersSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const { page, pageSize } = parsePagination(req.query);
    respondWithSuccess(
      res,
      await social_intelligenceService.listInfluencers({ ...parsed.data, page, pageSize }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createInfluencer(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = influencerSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await social_intelligenceService.createInfluencer(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateInfluencer(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = influencerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const item = await social_intelligenceService.updateInfluencer(id, parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteInfluencer(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await social_intelligenceService.deleteInfluencer(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listTrendsSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const { page, pageSize } = parsePagination(req.query);
    respondWithSuccess(
      res,
      await social_intelligenceService.listTrends({ ...parsed.data, page, pageSize }),
    );
  } catch (err) {
    next(err);
  }
}

export async function createTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = trendSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const item = await social_intelligenceService.createTrend(parsed.data);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = trendSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const id = requireParam(req.params.id, "id");
    const item = await social_intelligenceService.updateTrend(id, parsed.data);
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function deleteTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await social_intelligenceService.deleteTrend(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function listCompetitorReports(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listCompetitorReportsSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const { page, pageSize } = parsePagination(req.query);
    respondWithSuccess(
      res,
      await social_intelligenceService.listCompetitorReports({ ...parsed.data, page, pageSize }),
    );
  } catch (err) {
    next(err);
  }
}

export async function getInsight(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId, entityType, entityId } = req.query;
    if (!brandId || !entityType || !entityId) {
      return next(badRequest("brandId, entityType, and entityId are required"));
    }
    const item = await social_intelligenceService.getInsight(
      String(brandId),
      String(entityType),
      String(entityId),
    );
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function aiSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = aiSummarySchema.parse(req.body);
    const summary = await social_intelligenceService.summarizeAI(parsed);
    respondWithSuccess(res, summary, 201);
  } catch (err) {
    next(err);
  }
}
