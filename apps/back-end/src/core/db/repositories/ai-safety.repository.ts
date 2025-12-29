import { prisma } from "../../prisma.js";

import type { AIBannedAction, AISafetyConstraint, AIPromptFirewallRule } from "@prisma/client";

export type FirewallRulePayload = {
  name: string;
  matcherType: string;
  matcherValue: string;
  action: string;
  reason?: string;
  severity?: string;
  tags?: string;
};

export type SafetyConstraintPayload = {
  code: string;
  scope?: string;
  description?: string;
  ruleJson?: Record<string, unknown>;
  allowedActions?: string[];
  restrictedDomains?: string[];
  riskScore?: number;
};

export type BannedActionPayload = {
  code: string;
  description?: string;
  severity?: string;
  scope?: string;
  mitigation?: string;
};

export async function findActiveFirewallRules(): Promise<Array<AIPromptFirewallRule>> {
  return prisma.aIPromptFirewallRule.findMany({ where: { active: true } });
}

export async function findActiveSafetyConstraints(): Promise<Array<AISafetyConstraint>> {
  return prisma.aISafetyConstraint.findMany({ where: { active: true } });
}

export async function findBannedActions(): Promise<Array<AIBannedAction>> {
  return prisma.aIBannedAction.findMany();
}

export async function listFirewallRules(): Promise<Array<AIPromptFirewallRule>> {
  return prisma.aIPromptFirewallRule.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createFirewallRule(payload: FirewallRulePayload): Promise<AIPromptFirewallRule> {
  return prisma.aIPromptFirewallRule.create({
    data: {
      name: payload.name,
      matcherType: payload.matcherType,
      matcherValue: payload.matcherValue,
      action: payload.action as any,
      reason: payload.reason,
      severity: payload.severity as any,
      tags: payload.tags,
    },
  });
}

export async function listConstraints(): Promise<Array<AISafetyConstraint>> {
  return prisma.aISafetyConstraint.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createConstraint(payload: SafetyConstraintPayload): Promise<AISafetyConstraint> {
  return prisma.aISafetyConstraint.create({
    data: {
      code: payload.code,
      scope: payload.scope,
      description: payload.description,
      ruleJson: payload.ruleJson ? JSON.stringify(payload.ruleJson) : undefined,
      allowedActionsJson: payload.allowedActions ? JSON.stringify(payload.allowedActions) : undefined,
      restrictedDomainsJson: payload.restrictedDomains ? JSON.stringify(payload.restrictedDomains) : undefined,
      riskScore: payload.riskScore,
    },
  });
}

export async function listBannedActions(): Promise<Array<AIBannedAction>> {
  return prisma.aIBannedAction.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createBannedAction(payload: BannedActionPayload): Promise<AIBannedAction> {
  return prisma.aIBannedAction.create({
    data: {
      code: payload.code,
      description: payload.description,
      severity: payload.severity as any,
      scope: payload.scope,
      mitigation: payload.mitigation,
    },
  });
}
