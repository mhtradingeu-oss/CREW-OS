import { jest } from "@jest/globals";
import { AutomationRunStatus } from "@prisma/client";
import { AutomationService } from "../../modules/automation/automation.service.js";

const createService = (db: any) =>
  new AutomationService({
    notificationService: {},
    pricingService: {},
    publish: async () => undefined,
    publishActivity: async () => undefined,
    badRequest: (message: string) => new Error(message),
    notFound: (message: string) => new Error(message),
    db: db as any,
  });

describe("AutomationService (unit)", () => {
  it("lists automation rules with pagination", async () => {
    const now = new Date();
    const rules = [
      {
        id: "rule-1",
        brandId: "brand-1",
        name: "Test rule",
        description: null,
        state: "ACTIVE",
        enabled: true,
        createdAt: now,
        updatedAt: now,
        createdById: null,
        updatedById: null,
        lastRunAt: null,
        lastRunStatus: null,
        triggerEvent: "automation.test",
      },
    ];

    const automationRule = {
      count: jest.fn().mockImplementation(() => Promise.resolve(1)),
      findMany: jest.fn().mockImplementation(() => Promise.resolve(rules)),
    };
    const mockDb: any = {
      automationRule,
      $transaction: jest.fn().mockImplementation(() => Promise.resolve([1, rules])),
    };

    const service = createService(mockDb);
    const result = await service.list({ brandId: "brand-1", page: 1, pageSize: 20 });

    expect(result.total).toBe(1);
    expect(result.items?.[0]?.id).toBe("rule-1");
    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("creates automation rules", async () => {
    const now = new Date();
    const mockCreate = jest.fn().mockImplementation(() =>
      Promise.resolve({
        id: "rule-2",
        brandId: "brand-2",
        name: "Create test",
        description: "desc",
        state: "DRAFT",
        enabled: true,
        createdAt: now,
        updatedAt: now,
        createdById: "user-1",
        updatedById: "user-1",
        lastRunAt: null,
        lastRunStatus: null,
        triggerEvent: null,
      }),
    );
    const mockDb: any = {
      automationRule: { create: mockCreate },
    };

    const service = createService(mockDb);
    const created = await service.create({ name: "Create test", description: "desc", brandId: "brand-2", createdById: "user-1" });

    expect(created.name).toBe("Create test");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ state: "DRAFT", name: "Create test" }),
      }),
    );
  });

  it("handles events by creating automation runs", async () => {
    const ruleRecord = {
      id: "rule-3",
      brandId: "brand-3",
      name: "Event rule",
      description: null,
      state: "ACTIVE",
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: null,
      updatedById: null,
      lastRunAt: null,
      lastRunStatus: null,
      triggerEvent: "automation.test",
    };
    const versionRecord = {
      id: "version-1",
      ruleId: "rule-3",
      state: "ACTIVE",
      versionNumber: 1,
      conditionConfigJson: { foo: "bar" },
      actionsConfigJson: { actions: [] },
      metaSnapshotJson: null,
    };

    const mockDb: any = {
      automationRule: {
        findMany: jest.fn().mockImplementation(() => Promise.resolve([ruleRecord])),
        update: jest.fn().mockImplementation(() => Promise.resolve(ruleRecord)),
      },
      automationRuleVersion: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(versionRecord)),
      },
      automationRun: {
        findFirst: jest.fn().mockImplementation(() => Promise.resolve(null)),
        create: jest.fn().mockImplementation(() =>
          Promise.resolve({
            id: "run-1",
            startedAt: new Date(),
          }),
        ),
        update: jest.fn().mockImplementation(() =>
          Promise.resolve({
            id: "run-1",
            status: AutomationRunStatus.SUCCESS,
            startedAt: new Date(),
            finishedAt: new Date(),
          }),
        ),
      },
      automationLog: {
        create: jest.fn().mockImplementation(() => Promise.resolve(null)),
      },
    };

    const service = createService(mockDb);
    const event = {
      id: "evt-1",
      name: "automation.test",
      payload: { foo: "bar" },
      context: { brandId: "brand-3", correlationId: "cid-1" },
      occurredAt: new Date(),
    };

    const results = await service.handleEvent(event);

    expect(results).toHaveLength(1);
    expect(mockDb.automationRun.create).toHaveBeenCalled();
    expect(mockDb.automationLog.create).toHaveBeenCalled();
  });
});
