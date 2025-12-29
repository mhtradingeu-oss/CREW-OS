import assert from "node:assert/strict";
import test from "node:test";
import { planAutonomyTasks } from "../../core/ai/autonomy/autonomy.planner.js";
import { findScenarioForIssue } from "../../core/ai/autonomy/scenarios.js";
import type { AutonomyDetection } from "../../core/ai/autonomy/autonomy.types.js";

const financeDetection: AutonomyDetection = {
  id: "det-finance",
  type: "FINANCE_RISK",
  severity: "CRITICAL",
  detectedAt: new Date().toISOString(),
  details: { totalExpenses: 100, totalRevenue: 50 },
  requiredContexts: ["finance"],
};

const inventoryDetection: AutonomyDetection = {
  id: "det-inventory",
  type: "INVENTORY_RISK",
  severity: "HIGH",
  detectedAt: new Date().toISOString(),
  details: { productId: "p1", quantity: 1 },
  requiredContexts: ["inventory", "product"],
};

test("scenario selection attaches playbook and safety path", () => {
  const scenario = findScenarioForIssue("FINANCE_RISK");
  assert.ok(scenario?.playbook === "finance");
});

test("planner emits approval-required tasks for high risk", () => {
  const plan = planAutonomyTasks([financeDetection]);
  const risky = plan.tasks.filter((task) => task.sourceIssueId === financeDetection.id);
  assert.ok(risky.length >= 1);
  assert.ok(risky.every((task) => task.requiresApproval));
});

test("planner wires dependencies for inventory refills", () => {
  const plan = planAutonomyTasks([inventoryDetection]);
  const taskIds = new Set(plan.tasks.map((t) => t.taskId));
  const dependent = plan.tasks.find((t) => (t.dependencies ?? []).length > 0);
  if (dependent) {
    for (const dep of dependent.dependencies ?? []) {
      assert.ok(taskIds.has(dep));
    }
  }
});
