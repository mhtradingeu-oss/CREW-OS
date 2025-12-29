import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePlaybookGuardrail } from "../../core/ai/autonomy/autonomy.executor.js";
import type { AutonomyTask } from "../../core/ai/autonomy/autonomy.types.js";

const baseTask: AutonomyTask = {
  taskId: "t-1",
  agentId: "pricing-strategist",
  goal: "Slash price below floor without approval",
  contexts: [],
  engine: "PRICING_ENGINE",
  requiresApproval: false,
  inputs: { brandId: "b1" },
  createdAt: new Date().toISOString(),
  status: "PENDING",
  risk: "HIGH",
  playbookId: "pricing",
};

test("playbook guardrails block forbidden actions", () => {
  const guard = evaluatePlaybookGuardrail(baseTask);
  assert.ok(guard);
  assert.equal(guard?.safeToProceed, false);
  assert.ok((guard?.violations ?? []).length > 0);
});

test("playbook guardrails request approval when flagged", () => {
  const guard = evaluatePlaybookGuardrail({ ...baseTask, goal: "Propose price change", requiresApproval: true });
  assert.ok(guard);
  assert.equal(guard?.safeToProceed, false);
  assert.ok((guard?.requiredApprovals ?? []).length > 0);
});
