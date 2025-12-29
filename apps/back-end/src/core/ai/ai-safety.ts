import { forbidden } from "../http/errors.js";
import {
  findActiveFirewallRules,
  findActiveSafetyConstraints,
  findBannedActions,
} from "../db/repositories/ai-safety.repository.js";
import type { AIMessage } from "../ai-service/ai-client.js";
import { recordSafetyEvent, type RiskLevel } from "./ai-monitoring.js";

export type SafetyContext = {
  namespace?: string;
  agentName?: string;
  brandId?: string | null;
  tenantId?: string | null;
  runId: string;
  requestedActions?: string[];
};

function matchesRule(content: string, matcherType: string, matcherValue: string): boolean {
  const normalized = content.toLowerCase();
  const target = matcherValue.toLowerCase();
  switch (matcherType) {
    case "regex":
      try {
        const regex = new RegExp(matcherValue, "i");
        return regex.test(content);
      } catch {
        return false;
      }
    case "startsWith":
      return normalized.startsWith(target);
    case "equals":
      return normalized === target;
    default:
      return normalized.includes(target);
  }
}

function sanitizeContent(content: string, matcherType: string, matcherValue: string) {
  if (matcherType === "regex") {
    try {
      const regex = new RegExp(matcherValue, "ig");
      return content.replace(regex, "[REDACTED]");
    } catch {
      return content;
    }
  }
  return content.split(matcherValue).join("[REDACTED]");
}

function classifyRisk(messages: AIMessage[], requestedActions?: string[]): RiskLevel {
  const corpus = `${messages.map((m) => m.content).join(" ")}`.toLowerCase();
  const highRiskKeywords = ["delete", "drop table", "leak", "password", "credential", "pii"];
  if (highRiskKeywords.some((kw) => corpus.includes(kw))) return "HIGH";
  if ((requestedActions ?? []).length > 0) return "MEDIUM";
  return "LOW";
}

export async function applyPromptFirewall(
  messages: AIMessage[],
  context: SafetyContext,
): Promise<{ messages: AIMessage[]; riskLevel: RiskLevel }> {
  const rules = await findActiveFirewallRules();
  if (!rules.length) return { messages, riskLevel: classifyRisk(messages, context.requestedActions) };
  let updated = [...messages];
  for (const rule of rules) {
    const corpus = updated.map((m) => m.content).join("\n\n");
    if (!matchesRule(corpus, rule.matcherType, rule.matcherValue)) continue;
    if (rule.action === "BLOCK") {
      await recordSafetyEvent({
        type: "PROMPT_FIREWALL",
        action: "BLOCK",
        ruleId: rule.id,
        runId: context.runId,
        agentName: context.agentName,
        namespace: context.namespace,
        riskLevel: rule.severity ?? "HIGH",
        decision: "blocked",
        detail: { matcherType: rule.matcherType, matcherValue: rule.matcherValue },
        brandId: context.brandId,
        tenantId: context.tenantId,
      });
      throw forbidden("Prompt blocked by safety firewall");
    }
    if (rule.action === "SANITIZE") {
      updated = updated.map((msg) => ({
        ...msg,
        content: sanitizeContent(msg.content, rule.matcherType, rule.matcherValue),
      }));
      await recordSafetyEvent({
        type: "PROMPT_FIREWALL",
        action: "SANITIZE",
        ruleId: rule.id,
        runId: context.runId,
        agentName: context.agentName,
        namespace: context.namespace,
        riskLevel: rule.severity ?? "MEDIUM",
        decision: "sanitized",
        detail: { matcherType: rule.matcherType, matcherValue: rule.matcherValue },
        brandId: context.brandId,
        tenantId: context.tenantId,
      });
      continue;
    }
  }
  return { messages: updated, riskLevel: classifyRisk(updated, context.requestedActions) };
}

export async function enforceSafetyConstraints(context: SafetyContext) {
  const constraints = await findActiveSafetyConstraints();
  if (!constraints.length) return;
  for (const constraint of constraints) {
    const scopeMatches = constraint.scope ? context.namespace?.startsWith(constraint.scope) : true;
    if (!scopeMatches) continue;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = constraint.ruleJson ? JSON.parse(constraint.ruleJson) : {};
    } catch {
      parsed = {};
    }
    const restrictedDomains = Array.isArray(parsed.restrictedDomains)
      ? parsed.restrictedDomains.map(String)
      : [];
    if (restrictedDomains.length && context.namespace && restrictedDomains.includes(context.namespace)) {
      await recordSafetyEvent({
        type: "SAFETY_CONSTRAINT",
        action: "BLOCK",
        ruleId: constraint.id,
        runId: context.runId,
        agentName: context.agentName,
        namespace: context.namespace,
        riskLevel: "HIGH",
        decision: "blocked",
        detail: { restrictedDomains },
        brandId: context.brandId,
        tenantId: context.tenantId,
      });
      throw forbidden("Action blocked by safety constraint");
    }
  }
}

export async function enforceBannedActions(context: SafetyContext) {
  const banned = await findBannedActions();
  if (!banned.length) return;
  const actions = context.requestedActions ?? (context.namespace ? [context.namespace] : []);
  for (const action of actions) {
    const hit = banned.find((b) =>
      (b.code ? action.startsWith(b.code) : false) || (b.scope ? b.scope === context.namespace : false),
    );
    if (hit) {
      await recordSafetyEvent({
        type: "BANNED_ACTION",
        action,
        ruleId: hit.id,
        runId: context.runId,
        agentName: context.agentName,
        namespace: context.namespace,
        riskLevel: hit.severity ?? "HIGH",
        decision: "blocked",
        detail: { scope: hit.scope, description: hit.description },
        brandId: context.brandId,
        tenantId: context.tenantId,
      });
      throw forbidden("Requested action is banned");
    }
  }
}

export async function applySafetyLayers(params: {
  messages: AIMessage[];
  context: SafetyContext;
}): Promise<{ messages: AIMessage[]; riskLevel: RiskLevel }> {
  await enforceSafetyConstraints(params.context);
  await enforceBannedActions(params.context);
  return applyPromptFirewall(params.messages, params.context);
}
