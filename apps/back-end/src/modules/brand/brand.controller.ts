import type { Request, Response, NextFunction } from "express";
import { badRequest } from "../../core/http/errors.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { requireParam } from "../../core/http/params.js";
import { brandService } from "./brand.service.js";
import {
  brandAiIdentitySchema,
  brandAiConfigSchema,
  brandIdentitySchema,
  brandRulesSchema,
  listBrandSchema,
} from "./brand.validators.js";

function buildContext(req: Request) {
  return {
    tenantId: req.user?.tenantId,
    brandId: req.user?.brandId,
    role: req.user?.role,
    planContext: req.planContext,
  };
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = listBrandSchema.safeParse(req.query);
    if (!parsed.success) {
      return next(badRequest("Validation error", parsed.error.flatten()));
    }
    const items = await brandService.list(parsed.data, buildContext(req));
    respondWithSuccess(res, items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await brandService.getById(id, buildContext(req));
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await brandService.create(req.body, buildContext(req));
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const item = await brandService.update(id, req.body, buildContext(req));
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await brandService.remove(id, buildContext(req));
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function getIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const identity = await brandService.getIdentity(id, buildContext(req));
    respondWithSuccess(res, identity);
  } catch (err) {
    next(err);
  }
}

export async function upsertIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = brandIdentitySchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const identity = await brandService.upsertIdentity(id, payload, buildContext(req));
    respondWithSuccess(res, identity);
  } catch (err) {
    next(err);
  }
}

export async function refreshIdentity(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = brandAiIdentitySchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const insight = await brandService.refreshIdentityAi(
      id,
      {
        forceRegenerate: payload.forceRegenerate,
      },
      buildContext(req),
    );
    respondWithSuccess(res, insight, 201);
  } catch (err) {
    next(err);
  }
}

export async function refreshRules(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = brandAiIdentitySchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const insight = await brandService.refreshRulesConsistency(
      id,
      {
        forceRegenerate: payload.forceRegenerate,
      },
      buildContext(req),
    );
    respondWithSuccess(res, insight, 201);
  } catch (err) {
    next(err);
  }
}

export async function getRules(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const rules = await brandService.getRules(id, buildContext(req));
    respondWithSuccess(res, rules);
  } catch (err) {
    next(err);
  }
}

export async function upsertRules(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = brandRulesSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const rules = await brandService.upsertRules(id, payload, buildContext(req));
    respondWithSuccess(res, rules);
  } catch (err) {
    next(err);
  }
}

export async function getAiConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    const config = await brandService.getAiConfig(id, buildContext(req));
    respondWithSuccess(res, config);
  } catch (err) {
    next(err);
  }
}

export async function upsertAiConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = brandAiConfigSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const config = await brandService.upsertAiConfig(id, payload, buildContext(req));
    respondWithSuccess(res, config);
  } catch (err) {
    next(err);
  }
}

export async function getCurrentBrand(req: Request, res: Response, next: NextFunction) {
  try {
    const brandId = req.user?.brandId;
    if (!brandId) {
      return respondWithSuccess(res, { hasBrand: false });
    }
    const brand = await brandService.getById(brandId, buildContext(req));
    respondWithSuccess(res, { hasBrand: true, brand });
  } catch (err) {
    next(err);
  }
}
