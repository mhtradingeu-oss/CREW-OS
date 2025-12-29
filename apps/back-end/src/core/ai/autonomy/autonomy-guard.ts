import type { AIAgentDefinition } from "../../../ai/schema/ai-agents-manifest.js";
import { normalizeAutonomyLevel, type AutonomyLevel } from "./autonomy-levels.js";
export type AutonomyDecisionStatus = "allow" | "needs_approval" | "deny";

export type AutonomyDecision = {
  level: AutonomyLevel;
  status: AutonomyDecisionStatus;
  requireApproval: boolean;
  reason?: string;
  requestedAction?: string;
  restricted?: boolean;
};

const DEFAULT_ACTIONS = ["analyze", "summarize", "recommend", "draft"];
const HIGH_IMPACT_DOMAINS = [
  "pricing",
  "finance",
  "inventory",
  "operations",
  "support",
  "notification",
  "communication",
  "partner",
  "dealer",
  "stand",
];
const SIDE_EFFECT_ACTIONS = [
  "apply",
  "approve",
  "update",
  "change",
  "publish",
  "send",
  "schedule",
  "execute",
  "charge",
  "refund",
];

function normalizeAction(action?: string): string | undefined {
  return action?.toLowerCase().trim() || undefined;
}

function isSideEffectful(action?: string) {
  if (!action) return false;
  return SIDE_EFFECT_ACTIONS.some((code) => action.includes(code));
}

function isHighImpactDomain(domain?: string) {
  if (!domain) return false;
  return HIGH_IMPACT_DOMAINS.some((scope) => domain.toLowerCase().includes(scope));
}

export function decideAutonomy(params: {
  agent: Pick<AIAgentDefinition, "autonomyLevel" | "allowedActions" | "restrictedDomains">;
  requestedAction?: string;
  domain?: string;
  forceApproval?: boolean;
}): AutonomyDecision {
  const level = normalizeAutonomyLevel(params.agent.autonomyLevel);
  const requestedAction = normalizeAction(params.requestedAction);
  const allowedActions = params.agent.allowedActions?.length ? params.agent.allowedActions : DEFAULT_ACTIONS;
  const domainRestricted = Boolean(
    params.agent.restrictedDomains?.some((d) => params.domain?.toLowerCase().includes(d.toLowerCase())) ?? false,
  );

  const baseDecision: AutonomyDecision = {
    level,
    status: "allow",
    requireApproval: false,
    requestedAction,
    restricted: domainRestricted,
  };

  if (domainRestricted) {
    return { ...baseDecision, status: "deny", requireApproval: true, reason: "Restricted domain" };
  }

  const actionAllowed = !requestedAction || allowedActions.some((a) => requestedAction.includes(a.toLowerCase()));
  const highImpact = isHighImpactDomain(params.domain);

  if (level === "viewer") {
    if (isSideEffectful(requestedAction)) {
      return { ...baseDecision, status: "deny", requireApproval: true, reason: "Viewer cannot perform side effects" };
    }
    return baseDecision;
  }

  if (level === "advisor") {
    if (!actionAllowed || isSideEffectful(requestedAction) || highImpact) {
      return {
        ...baseDecision,
        status: "needs_approval",
        requireApproval: true,
        reason: "Advisor requires approval for side effects or high-impact scopes",
      };
    }
    return baseDecision;
  }

  // operator
  if (!actionAllowed) {
    return {
      ...baseDecision,
      status: "deny",
      requireApproval: true,
      reason: "Requested action not in allowedActions",
    };
  }

  if (params.forceApproval || highImpact || isSideEffectful(requestedAction)) {
    return {
      ...baseDecision,
      status: "needs_approval",
      requireApproval: true,
      reason: "Operator actions default to approval for safety",
    };
  }

  return baseDecision;
}
