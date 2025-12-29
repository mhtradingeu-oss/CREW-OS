import assert from "node:assert/strict";
import test from "node:test";
import { AUTONOMY_SCENARIOS, findScenarioForIssue } from "../../core/ai/autonomy/scenarios.js";
import type { AutonomyIssueType } from "../../core/ai/autonomy/autonomy.types.js";

const allIssues: AutonomyIssueType[] = [
  "PRICING_ANOMALY",
  "MARGIN_DROP",
  "COMPETITOR_PRESSURE",
  "INVENTORY_RISK",
  "CRM_CHURN_RISK",
  "MARKETING_UNDERPERFORMANCE",
  "PARTNER_RISK",
  "FINANCE_RISK",
  "OPERATIONS_ALERT",
  "SUPPORT_ALERT",
];

test("every issue type maps to a scenario", () => {
  for (const issue of allIssues) {
    const scenario = findScenarioForIssue(issue);
    assert.ok(scenario, `Scenario missing for ${issue}`);
    assert.ok(scenario?.playbook, `Playbook missing for ${issue}`);
  }
});

test("scenarios expose safe and high-risk action paths", () => {
  for (const scenario of AUTONOMY_SCENARIOS) {
    assert.ok(scenario.safeActions.length >= 1, `${scenario.name} needs safe actions`);
    assert.ok(scenario.highRiskActions.length >= 1, `${scenario.name} needs high-risk actions`);
  }
});
