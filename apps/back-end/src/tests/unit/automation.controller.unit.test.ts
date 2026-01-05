import { describe, it, expect, beforeAll, beforeEach, afterEach } from "@jest/globals";

const mockGetUserPermissions = jest.fn();

import type { AutomationService } from "../../modules/automation/automation.service.js";
import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../../core/security/rbac.js";

let automationService: AutomationService;
let update: typeof import("../../modules/automation/automation.controller.js").update;

beforeAll(async () => {
  await (jest as any).unstable_mockModule("../../core/security/rbac.js", () => ({
    getUserPermissions: mockGetUserPermissions,
  }));

  const automationServiceModule = await import(
    "../../modules/automation/automation.service.js"
  );
  automationService = automationServiceModule.automationService;

  const controllerModule = await import(
    "../../modules/automation/automation.controller.js"
  );
  update = controllerModule.update;
});

const basePayload = {
  ruleId: "ckq0rw2qm0000hau0v7o5g13m",
  versionNumber: 2,
  triggerEvent: "automation.test",
  conditionConfigJson: {
    all: [{ path: "status", op: "eq", value: "ok" }],
  },
  actionsConfigJson: {
    actions: [{ type: "log" }],
  },
  state: "ACTIVE",
};

function createMockReq(): AuthenticatedRequest {
  const req: any = {
    user: {
      id: "user-1",
      role: "BRAND_OPERATOR",
      brandId: "brand-1",
      tenantId: "tenant-1",
    },
    params: { id: basePayload.ruleId },
    body: { ...basePayload },
    query: {},
  };
  req.get = jest.fn().mockReturnValue(undefined);
  req.header = jest.fn().mockReturnValue(undefined);
  return req;
}

function createMockRes(): Partial<Response> & {
  statusCode: number;
  body?: unknown;
} {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((payload: unknown) => {
    res.body = payload;
    return res;
  });

  return res;
}

describe("automation.controller.update", () => {
  let updateSpy: jest.SpiedFunction<AutomationService["update"]>;

  beforeEach(() => {
    jest.clearAllMocks();
    updateSpy = jest.spyOn(automationService, "update");
  });

  afterEach(() => {
    updateSpy.mockRestore();
  });

  it("rejects activation when permissions are missing", async () => {
    mockGetUserPermissions.mockResolvedValue([]);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await update(req, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      code: "activation_gate_failed",
      message: "ActivationGate failed",
      details: [
        {
          code: "automation.permission.missing",
          message: "Missing permission 'automation:rules:activate'.",
        },
      ],
    });

    expect(updateSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("allows activation when permission is present", async () => {
    mockGetUserPermissions.mockResolvedValue([
      "automation:rules:activate",
    ]);

    updateSpy.mockResolvedValue({ status: "updated" } as any);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await update(req, res as Response, next);

    expect(updateSpy).toHaveBeenCalledWith(
      basePayload.ruleId,
      expect.objectContaining({
        createdById: "user-1",
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      success: true,
      data: { status: "updated" },
    });

    expect(next).not.toHaveBeenCalled();
  });
});
