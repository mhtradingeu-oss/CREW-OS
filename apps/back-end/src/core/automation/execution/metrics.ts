import { Counter, Histogram } from "prom-client";
import { register } from "../../metrics/metrics.js";

export const automationExecutionTotal = new Counter({
  name: "automation_execution_total",
  help: "Total automation execution attempts",
  registers: [register],
  labelNames: ["result"] as const,
});

export const automationExecutionFailed = new Counter({
  name: "automation_execution_failed",
  help: "Total failed automation executions",
  registers: [register],
});

export const automationExecutionLatency = new Histogram({
  name: "automation_execution_latency",
  help: "Latency (seconds) of automation executions",
  registers: [register],
  labelNames: ["result"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
});
