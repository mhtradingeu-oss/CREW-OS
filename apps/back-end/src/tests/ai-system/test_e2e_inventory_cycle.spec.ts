import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const lowStock: AutonomyDetection = {
  id: "det-inv",
  type: "INVENTORY_RISK",
  severity: "MEDIUM",
  detectedAt: new Date().toISOString(),
  details: { productId: "p1", warehouseId: "w1", brandId: "b1" },
  requiredContexts: ["inventory", "product", "brand"],
};

test("inventory cycle drafts replenishment before approvals", async () => {
  const plan = planAutonomyTasks([lowStock]);
  const task = plan.tasks[0];
  assert.ok(task, "planner should return a task");
  assert.equal(task.playbookId, "inventory");
  assert.equal(task.scenario, "LowStockReplenishment");

  const { result } = await executeAutonomyTask(task, { simulateOnly: true, skipGovernance: true });
  assert.equal(result.success, true);
});
