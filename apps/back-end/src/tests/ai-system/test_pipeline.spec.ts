import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const detection: AutonomyDetection = {
  id: "det-1",
  type: "MARKETING_UNDERPERFORMANCE",
  severity: "MEDIUM",
  detectedAt: new Date().toISOString(),
  details: { campaignId: "c1", brandId: "b1" },
  requiredContexts: ["marketing", "brand"],
};

test("autonomy planner feeds executor simulate path", async () => {
  const plan = planAutonomyTasks([detection]);
  const task = plan.tasks[0];
  assert.ok(task, "planner should return a task");
  assert.ok(task.playbookId === "marketing");

  const { result } = await executeAutonomyTask(task, { simulateOnly: true, skipGovernance: true });
  assert.equal(result.success, true);
  assert.ok(result.engineOutput);
});
