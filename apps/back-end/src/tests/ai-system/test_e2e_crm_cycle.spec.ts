import assert from "node:assert/strict";
import test from "node:test";
import { executeAutonomyTask } from "../../core/ai/autonomy/autonomy.executor.js";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const churnRisk: AutonomyDetection = {
  id: "det-crm",
  type: "CRM_CHURN_RISK",
  severity: "MEDIUM",
  detectedAt: new Date().toISOString(),
  details: { leadId: "lead-1", brandId: "b1" },
  requiredContexts: ["crm-client", "brand"],
};

test("crm cycle proposes save plan without executing risky offers", async () => {
  const plan = planAutonomyTasks([churnRisk]);
  const task = plan.tasks[0];
  assert.ok(task, "planner should return a task");
  assert.equal(task.playbookId, "crm");
  assert.equal(task.scenario, "ChurnRiskDetected");

  const { result } = await executeAutonomyTask(task, { simulateOnly: true, skipGovernance: true });
  assert.equal(result.success, true);
});
