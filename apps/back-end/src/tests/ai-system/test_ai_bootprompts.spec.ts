import assert from "node:assert/strict";
import test from "node:test";
import { AI_AGENTS_MANIFEST } from "../../ai/schema/ai-agents-manifest.js";
import { decideAutonomy } from "../../core/ai/autonomy/autonomy-guard.js";

test("every agent has a boot prompt", () => {
  const missing = AI_AGENTS_MANIFEST.filter((agent) => !agent.bootPrompt || agent.bootPrompt.trim().length < 10);
  assert.equal(missing.length, 0, `Agents missing bootPrompt: ${missing.map((a) => a.name).join(", ")}`);
});

test("high-impact operator actions require approval", () => {
  const decision = decideAutonomy({
    agent: {
      autonomyLevel: "operator",
      allowedActions: ["apply", "update"],
      restrictedDomains: [],
    },
    requestedAction: "apply price change",
    domain: "pricing",
    forceApproval: true,
  });
  assert.equal(decision.status, "needs_approval");
  assert.equal(decision.requireApproval, true);
});
