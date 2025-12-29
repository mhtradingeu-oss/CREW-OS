import assert from "node:assert/strict";
import test from "node:test";
import { router as monitoringRouter } from "../../modules/ai-monitoring/ai-monitoring.routes.js";

test("ai-monitoring routes expose safety-events endpoint", () => {
  const stack = (monitoringRouter as any).stack || [];
  const hasSafety = stack.some((layer: any) => layer?.route?.path === "/safety-events");
  assert.equal(hasSafety, true, "safety-events route should be registered");
});
