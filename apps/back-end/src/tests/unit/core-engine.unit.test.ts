
import { describe, it, expect, jest } from "@jest/globals";
import type { Prisma } from "@prisma/client";
import { CoreAutomationEngine } from "../../core/automation/core-engine.js";
import { prisma } from "../../core/prisma.js";

// -----------------------------
// Helpers: typed jest.fn that never becomes `never`
// -----------------------------
const mockAsync = () => jest.fn();
const mockSync = () => jest.fn();

// -----------------------------
// Prisma mock factory
// -----------------------------
function makeMockPrisma() {
  // All delegates at top level for engine compatibility
  const automationExecutionLog = {
    create: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "log-1" }),
    update: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "log-1" }),
  };
  const automationRun = {
    create: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "run-1" }),
    update: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "run-1" }),
  };
  const automationActionRun = {
    create: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "action-1" }),
    update: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "action-1" }),
  };
  const automationRuleVersion = {
    findMany: (jest.fn() as jest.Mock<any>).mockResolvedValue([]),
    create: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "rv-1", versionNumber: 1 }),
    findFirst: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "rv-1", versionNumber: 1 }),
  };
  const automationRule = {
    findMany: (jest.fn() as jest.Mock<any>).mockResolvedValue([]),
  };
  const prismaLike = {
    $transaction: jest.fn(async (cb: any) => cb({
      automationExecutionLog,
      automationRun,
      automationActionRun,
      automationRuleVersion,
      automationRule,
    })),
    automationExecutionLog,
    automationRun,
    automationActionRun,
    automationRuleVersion,
    automationRule,
  };
  return { prismaLike };
}

// -----------------------------
// Engine builder (NO TS parser issues; this is correct in ts-jest)
// -----------------------------
function buildEngine(deps?: { notificationService?: any; incidentService?: any }) {
  const { prismaLike } = makeMockPrisma();

  // kill switch: only methods used by engine
  const killSwitch = {
    assertGlobalEnabled: mockSync(),
    ensureExecutionAllowed: mockAsync(),
  };

  // notification service
  const notificationService = deps?.notificationService ?? {
    createNotification: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "notif-1" }),
  };
  // incident reporter
  const incidentReporter = deps?.incidentService ?? {
    createIncident: (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "incident-1" }),
  };

  const engine = new CoreAutomationEngine({
    prisma: prismaLike as unknown as typeof prisma,
    notificationService: notificationService as unknown as any,
    killSwitchService: killSwitch as unknown as any,
    incidentService: incidentReporter as unknown as any,
  });

  return { engine, prismaLike, killSwitch, incidentReporter, notificationService };
}

// -----------------------------
// Tests
// -----------------------------
describe("CoreAutomationEngine", () => {
  it("executes notification action and records success", async () => {
    const createNotification = (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "notif-123" });
    const createIncident = (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "incident-1" });
    const notificationService = { createNotification };
    const incidentService = { createIncident };
    const { engine } = buildEngine({ notificationService, incidentService });

    // Arrange: rule versions returned by DB
    (engine['db'].automationRuleVersion.findMany as any).mockResolvedValue([
      {
        id: "rv-1",
        ruleId: "rule-1",
        brandId: "brand-1",
        enabled: true,
        triggerEvent: "TEST_EVENT",
        actionsJson: JSON.stringify([
          {
            type: "notification",
            params: {
              title: "Test Title",
              message: "Test Message for {{userId}}",
              type: "test",
              userId: "u1",
              brandId: "brand-1"
            }
          }
        ]),
      },
    ]);
    // Arrange: rules returned by DB (if engine expects it)
    (engine['db'].automationRule.findMany as any).mockResolvedValue([
      {
        id: "rule-1",
        brandId: "brand-1",
        enabled: true,
        triggerEvent: "TEST_EVENT",
        actionsJson: JSON.stringify([
          {
            type: "notification",
            params: {
              title: "Test Title",
              message: "Test Message for {{userId}}",
              type: "test",
              userId: "u1",
              brandId: "brand-1"
            }
          }
        ]),
      },
    ]);

    await engine.executeAutomationEvent(
      "TEST_EVENT",
      { userId: "u1" },
      { brandId: "brand-1" }
    );

    expect(createNotification).toHaveBeenCalled();
    expect(engine['db'].automationExecutionLog.create).toHaveBeenCalled();
    expect(engine['db'].automationRun.create).toHaveBeenCalled();
    expect(engine['db'].automationActionRun.create).toHaveBeenCalled();
  });

  it("records incident when notification fails", async () => {
    const createNotification = (jest.fn() as jest.Mock<any>).mockRejectedValue(new Error("boom"));
    const createIncident = (jest.fn() as jest.Mock<any>).mockResolvedValue({ id: "incident-1" });
    const notificationService = { createNotification };
    const incidentService = { createIncident };
    const { engine, incidentReporter } = buildEngine({ notificationService, incidentService });

    (engine['db'].automationRuleVersion.findMany as any).mockResolvedValue([
      {
        id: "rv-1",
        ruleId: "rule-1",
        brandId: "brand-1",
        enabled: true,
        triggerEvent: "TEST_EVENT",
        actionsJson: JSON.stringify([
          {
            type: "notification",
            params: {
              title: "Test Title",
              message: "Test Message for {{userId}}",
              type: "test",
              userId: "u1",
              brandId: "brand-1"
            }
          }
        ]),
      },
    ]);
    (engine['db'].automationRule.findMany as any).mockResolvedValue([
      {
        id: "rule-1",
        brandId: "brand-1",
        enabled: true,
        triggerEvent: "TEST_EVENT",
        actionsJson: JSON.stringify([
          {
            type: "notification",
            params: {
              title: "Test Title",
              message: "Test Message for {{userId}}",
              type: "test",
              userId: "u1",
              brandId: "brand-1"
            }
          }
        ]),
      },
    ]);

    await engine.executeAutomationEvent(
      "TEST_EVENT",
      { userId: "u1" },
      { brandId: "brand-1" }
    );

    expect(incidentReporter.createIncident).toHaveBeenCalled();
  });
});
