import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import type { AutonomyTask } from "../../core/ai/autonomy/autonomy.types.js";

const approvalTask: AutonomyTask = {
  taskId: "t-govern",
  agentId: "pricing-strategist",
  goal: "Apply tactical price change with guardrails",
  contexts: [],
  engine: "PRICING_ENGINE",
  requiresApproval: true,
  inputs: { brandId: "b1" },
  createdAt: new Date().toISOString(),
  status: "PENDING",
  risk: "HIGH",
  playbookId: "pricing",
};

test("executeAutonomyTask blocks when approval required and governance not skipped", async () => {
  const { result, governance } = await executeAutonomyTask(approvalTask, { actorOptions: { dryRun: true } });
  assert.equal(result.success, false);
  assert.ok(governance);
  assert.equal(governance?.safeToProceed, false);
});
