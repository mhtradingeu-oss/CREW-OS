import type { Request, Response, NextFunction } from "express";
import * as service from "./internal-intelligence.service.js";

export async function getInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getInsights(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.getRecommendations(req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
