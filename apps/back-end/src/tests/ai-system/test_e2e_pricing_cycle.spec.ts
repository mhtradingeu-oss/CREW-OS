import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const competitorSignal: AutonomyDetection = {
  id: "det-pricing",
  type: "COMPETITOR_PRESSURE",
  severity: "MEDIUM",
  detectedAt: new Date().toISOString(),
  details: { productId: "p1", brandId: "b1", competitor: "compX" },
  requiredContexts: ["product", "pricing", "brand"],
};

test("pricing cycle uses pricing playbook with safe actions", async () => {
  const plan = planAutonomyTasks([competitorSignal]);
  const task = plan.tasks[0];
  assert.ok(task, "planner should return a task");
  assert.equal(task.playbookId, "pricing");
  assert.equal(task.scenario, "PriceDropCompetitor");

  const { result } = await executeAutonomyTask(task, { simulateOnly: true, skipGovernance: true });
  assert.equal(result.success, true);
});
