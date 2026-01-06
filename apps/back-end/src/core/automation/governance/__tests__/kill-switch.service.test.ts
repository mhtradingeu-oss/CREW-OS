const { describe, it, test, expect } = require("@jest/globals");

import { AutomationKillSwitchService } from "../kill-switch.service.js";
import { env } from "../../../config/env.js";
// import removed: KillSwitchContext type is not used at runtime

const buildContext = () => ({
  module: "test",
  action: "kill-switch",
  correlationId: "cid",
});

describe("AutomationKillSwitchService", () => {
  const baseEnv = env.AUTOMATION_GLOBAL_DISABLED;

  afterAll(() => {
    env.AUTOMATION_GLOBAL_DISABLED = baseEnv;
  });

  it("blocks when the global kill switch is active", () => {
    env.AUTOMATION_GLOBAL_DISABLED = true;
    const service = new AutomationKillSwitchService({
      getBrandKillSwitch: jest.fn(),
      findActiveExecutionKillSwitch: jest.fn(),
    } as any);

    expect(() => service.assertGlobalEnabled(buildContext())).toThrow(/kill switch/);
  });

  it("blocks brand executions when a brand-level switch is enabled", async () => {
    env.AUTOMATION_GLOBAL_DISABLED = false;
    const repository = {
      getBrandKillSwitch: jest.fn().mockImplementation(async (brandId: string) => ({
        enabled: true,
        reason: "incident",
      })),
      findActiveExecutionKillSwitch: jest.fn().mockImplementation(async () => undefined),
    };
    const service = new AutomationKillSwitchService(repository as any);

    await expect(service.ensureApprovalAllowed("approval-1", "brand-1", buildContext())).rejects.toThrow(
      /kill switch/,
    );
    expect(repository.getBrandKillSwitch).toHaveBeenCalledWith("brand-1");
  });

  it("blocks executions when an execution-level switch exists", async () => {
    env.AUTOMATION_GLOBAL_DISABLED = false;
    const repository = {
      getBrandKillSwitch: jest.fn().mockImplementation(async () => undefined),
      findActiveExecutionKillSwitch: jest.fn().mockImplementation(async (targetType: string, targetId: string) => ({
        id: "kill-1",
        targetId: targetId,
        targetType: targetType,
        reason: "manual",
        isActive: true,
      })),
    };
    const service = new AutomationKillSwitchService(repository as any);

    await expect(service.ensureExecutionAllowed("execution-1", buildContext())).rejects.toThrow(/kill switch/);
    expect(repository.findActiveExecutionKillSwitch).toHaveBeenCalledWith("EXECUTION", "execution-1");
  });
});
