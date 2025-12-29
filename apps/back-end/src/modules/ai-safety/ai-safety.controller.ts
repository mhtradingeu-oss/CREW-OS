import type { Request, Response } from "express";
import {
  createBannedAction,
  createConstraint,
  createFirewallRule,
  listBannedActions,
  listConstraints,
  listFirewallRules,
  recordOversight,
  recordRedTeamFinding,
  testPrompt,
} from "./ai-safety.service.js";

export async function getFirewallRules(_req: Request, res: Response) {
  const data = await listFirewallRules();
  res.json({ data });
}

export async function postFirewallRule(req: Request, res: Response) {
  const data = await createFirewallRule(req.body);
  res.json({ data });
}

export async function getConstraints(_req: Request, res: Response) {
  const data = await listConstraints();
  res.json({ data });
}

export async function postConstraint(req: Request, res: Response) {
  const data = await createConstraint(req.body);
  res.json({ data });
}

export async function getBannedActions(_req: Request, res: Response) {
  const data = await listBannedActions();
  res.json({ data });
}

export async function postBannedAction(req: Request, res: Response) {
  const data = await createBannedAction(req.body);
  res.json({ data });
}

export async function postOversight(req: Request, res: Response) {
  const data = await recordOversight(req.body);
  res.json({ data });
}

export async function postRedTeam(req: Request, res: Response) {
  const data = await recordRedTeamFinding(req.body);
  res.json({ data });
}

export async function postTestPrompt(req: Request, res: Response) {
  const data = await testPrompt(req.body);
  res.json({ data });
}
