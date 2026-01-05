import { describe, it, test, expect } from "@jest/globals";
import { executeAutomationActions } from "../executor.js";
import * as registry from "../../actions/registry.js";

function mockFn<T extends any[] = any[], R = any>() {
  const fn = (...args: T): R => {
    ((fn as typeof fn & { calls: T[] }).calls).push(args);
    return undefined as unknown as R;
  };
  (fn as any).calls = [] as T[];
  return fn as ((...args: T) => R) & { calls: T[] };
}

describe("executor policy gate", () => {
  it("DENY should block runner.execute", async () => {
    const execute = mockFn();
    (registry as any).getRunner = () => ({
      type: "INTERNAL_LOG",
      metadata: { risk: "LOW", sideEffect: "NONE", description: "x" },
      schema: { parse: () => ({}) },
      execute,
    });
    // ضبط process.env لقتل التنفيذ
    process.env.AI_KILL_SWITCH = "true";
    process.env.AI_AUTONOMY_ENABLED = "true";
    process.env.AI_MAX_RISK = "CRITICAL";
    await executeAutomationActions({
      rule: { id: "r1", ruleVersionId: "v1", name: "Test Rule", triggerEvent: "AUTH_LOGIN_SUCCESS", actions: [{ type: "INTERNAL_LOG", params: {} }] },
      event: { 
        id: "event-1", 
        type: "AUTH_LOGIN_SUCCESS", 
        payload: { userId: "u", ip: "1.2.3.4", ua: "ua", time: "now" }, 
        occurredAt: new Date() 
      },
    });
    expect(execute.calls.length).toBe(0);
    process.env.AI_KILL_SWITCH = "false";
  });

  it("ALLOW should permit runner.execute", async () => {
    const execute = mockFn();
    (registry as any).getRunner = () => ({
      type: "INTERNAL_LOG",
      metadata: { risk: "LOW", sideEffect: "NONE", description: "x" },
      schema: { parse: () => ({}) },
      execute,
    });
    process.env.AI_KILL_SWITCH = "false";
    process.env.AI_AUTONOMY_ENABLED = "true";
    process.env.AI_MAX_RISK = "CRITICAL";
    await executeAutomationActions({
      rule: { id: "r1", ruleVersionId: "v1", name: "Test Rule", triggerEvent: "AUTH_LOGIN_SUCCESS", actions: [{ type: "INTERNAL_LOG", params: {} }] },
      event: { 
        id: "event-2",
        type: "AUTH_LOGIN_SUCCESS", 
        payload: { userId: "u", ip: "1.2.3.4", ua: "ua", time: "now" },
        occurredAt: new Date()
      },
    });
    expect(execute.calls.length).toBe(1);
  });
});
