import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const roasDrop: AutonomyDetection = {
  id: "det-marketing",
  type: "MARKETING_UNDERPERFORMANCE",
  severity: "MEDIUM",
  detectedAt: new Date().toISOString(),
  details: { campaignId: "c1", brandId: "b1" },
  requiredContexts: ["marketing", "brand"],
};

test("marketing cycle stays in safe budget adjustment path", async () => {
  const plan = planAutonomyTasks([roasDrop]);
  const task = plan.tasks[0];
  assert.ok(task, "planner should return a task");
  assert.equal(task.playbookId, "marketing");
  assert.equal(task.scenario, "MarketingROASDrop");

  const { result } = await executeAutonomyTask(task, { simulateOnly: true, skipGovernance: true });
  assert.equal(result.success, true);
});
