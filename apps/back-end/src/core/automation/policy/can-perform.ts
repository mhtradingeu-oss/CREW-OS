/**
 * Decision Philosophy: centralize policy checks so every caller sees a deterministic, side-effect-free response
 * for whether an action is allowable. Inputs capture metadata, environment, approvals, and runtime guards.
 * Rule Order: kill switch → global autonomy gate → risk ceiling → production approval gate → staging approval gate → allow.
 * هذا التصميم آمن للتوسّع لأنه يعزل مدخلات السياسة عن التنفيذ، ويجعل كل قاعدة خطوة مستقلة يمكن إدراجها أو تعديلها دون انحراف.
 * Extensions later (roles, approval workflows, budget/rate limits) can add new checks before the final allow path.
 */

import type { ActionApprovalHints, ActionMetadata, ActionRisk } from "../actions/metadata.js";
import type { ActionType } from "../actions/types.js";

const decisionRiskOrder: ActionRisk[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

type PolicyEnvironment = "development" | "staging" | "production";


import type { ExplainResponse } from "../../explain/types.js";

export type PolicyDecision =
  | { type: "ALLOW" }
  | { type: "DENY"; reason: string; explain?: ExplainResponse; correlationId?: string }
  | { type: "REQUIRE_APPROVAL"; reason: string; explain?: ExplainResponse; correlationId?: string };

interface PolicyInput {
  actionId: ActionType;
  metadata: ActionMetadata;
  environment: PolicyEnvironment;
  approvals?: {
    approved: boolean;
    approverRole?: string;
  };
  flags: {
    AI_AUTONOMY_ENABLED: boolean;
    AI_MAX_RISK: ActionRisk;
    AI_KILL_SWITCH: boolean;
  };
}

function isRiskHigherThanThreshold(subject: ActionRisk, threshold: ActionRisk): boolean {
  const subjectIndex = decisionRiskOrder.indexOf(subject);
  const thresholdIndex = decisionRiskOrder.indexOf(threshold);

  if (subjectIndex === -1 || thresholdIndex === -1) {
    return false;
  }

  return subjectIndex > thresholdIndex;
}


export function canPerform(input: PolicyInput & { correlationId?: string }): PolicyDecision {
  const { metadata, environment, approvals, flags, correlationId } = input;
  void input.actionId;

  // Helper to build explain object
  function buildExplain(reason: string): ExplainResponse {
    return {
      summary: reason,
      decisionPath: [
        flags.AI_KILL_SWITCH ? "Checked global kill switch" : undefined,
        !flags.AI_AUTONOMY_ENABLED ? "Checked autonomy enabled" : undefined,
        isRiskHigherThanThreshold(metadata.risk, flags.AI_MAX_RISK) ? "Checked risk ceiling" : undefined,
        environment === "production" ? "Checked production approval" : environment === "staging" ? "Checked staging approval" : undefined,
      ].filter(Boolean) as string[],
      contributingFactors: [reason],
      outcome: "FAILED",
      confidence: "HIGH",
      evidence: { metrics: {}, logs: {}, failures: {} },
    };
  }

  if (flags.AI_KILL_SWITCH) {
    const reason = "Global AI kill switch enabled";
    return { type: "DENY", reason, explain: buildExplain(reason), correlationId };
  }

  if (!flags.AI_AUTONOMY_ENABLED) {
    const reason = "AI autonomy disabled by configuration";
    return { type: "DENY", reason, explain: buildExplain(reason), correlationId };
  }

  if (isRiskHigherThanThreshold(metadata.risk, flags.AI_MAX_RISK)) {
    const reason = "Action risk exceeds configured maximum";
    return { type: "DENY", reason, explain: buildExplain(reason), correlationId };
  }

  const approvalHints: ActionApprovalHints | undefined = metadata.approvalHints;
  const needsProdApproval = environment === "production" && approvalHints?.requiresApprovalInProd === true;
  const needsStagingApproval = environment === "staging" && approvalHints?.requiresApprovalInStaging === true;

  if (needsProdApproval && approvals?.approved !== true) {
    const reason = "Action requires approval in production";
    return { type: "REQUIRE_APPROVAL", reason, explain: buildExplain(reason), correlationId };
  }

  if (needsStagingApproval && approvals?.approved !== true) {
    const reason = "Action requires approval in staging";
    return { type: "REQUIRE_APPROVAL", reason, explain: buildExplain(reason), correlationId };
  }

  return { type: "ALLOW" };
}
