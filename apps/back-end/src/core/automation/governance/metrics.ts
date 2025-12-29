import { Counter } from "prom-client";
import { register } from "../../metrics/metrics.js";

export const automationIncidentTotal = new Counter({
  name: "automation_incident_total",
  help: "Total automation incidents recorded by severity and type",
  registers: [register],
  labelNames: ["type", "severity", "status"] as const,
});

export const automationKillSwitchActivated = new Counter({
  name: "automation_kill_switch_activated",
  help: "Kill switch activations that block automation executions",
  registers: [register],
  labelNames: ["scope"] as const,
});

export const automationRollbackTotal = new Counter({
  name: "automation_rollback_total",
  help: "Lifecycle events for automation rollbacks",
  registers: [register],
  labelNames: ["stage", "status"] as const,
});
