import type { Request, Response } from "express";
import {
  getAgentActivity,
  getEngineHealth,
  getPerformanceMetrics,
  getSafetyEvents,
  getSystemAlerts,
  getTokenUsage,
} from "./ai-monitoring.service.js";

export async function listEngineHealth(_req: Request, res: Response) {
  const data = await getEngineHealth();
  res.json({ data });
}

export async function listAgentActivity(_req: Request, res: Response) {
  const data = await getAgentActivity();
  res.json({ data });
}

export async function listTokenUsage(_req: Request, res: Response) {
  const data = await getTokenUsage();
  res.json({ data });
}

export async function listPerformanceMetrics(_req: Request, res: Response) {
  const data = await getPerformanceMetrics();
  res.json({ data });
}

export async function listSystemAlerts(_req: Request, res: Response) {
  const data = await getSystemAlerts();
  res.json({ data });
}

export async function listSafetyEvents(_req: Request, res: Response) {
  const data = await getSafetyEvents();
  res.json({ data });
}
