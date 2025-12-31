import { jest } from "@jest/globals";
import type { PolicyViolation } from "../../modules/automation/automation.types.js";
import { automationService } from "../../modules/automation/automation.service.js";
import { update } from "../../modules/automation/automation.controller.js";

let mockGetUserPermissions: jest.MockedFunction<(userId: string) => Promise<string[]>>;

jest.mock("../../core/security/rbac.js", () => {
  const actual = jest.requireActual<typeof import("../../core/security/rbac.js")>("../../core/security/rbac.js");
  mockGetUserPermissions = jest.fn();
  return {
    ...actual,
    getUserPermissions: mockGetUserPermissions,
  };
});

type UpdateFn = typeof automationService.update;

const basePayload = {
  ruleId: "ckq0rw2qm0000hau0v7o5g13m",
  versionNumber: 2,
  triggerEvent: "automation.test",
  conditionConfigJson: { all: [{ path: "status", op: "eq", value: "ok" }] },
  actionsConfigJson: { actions: [{ type: "log" }] },
  state: "ACTIVE" as const,
};

function createMockReq() {
  return {
    user: { id: "user-1", role: "BRAND_OPERATOR", brandId: "brand-1", tenantId: "tenant-1" },
    params: { id: basePayload.ruleId },
    body: { ...basePayload },
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  jest.spyOn(res, "status");
  jest.spyOn(res, "json");
  return res;
}

describe("automation.controller.update", () => {
  let updateSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.restoreAllMocks();
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

    await update(req, res, next as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      code: "activation_gate_failed",
      message: "ActivationGate failed",
      details: [{ code: "automation.permission.missing", message: "Missing permission 'automation:rules:activate'." }],
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("allows activation when permission present", async () => {
    mockGetUserPermissions.mockResolvedValue(["automation:rules:activate"]);
    updateSpy.mockResolvedValue({} as Awaited<ReturnType<UpdateFn>>);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await update(req, res, next as any);

    expect(updateSpy).toHaveBeenCalledWith(basePayload.ruleId, expect.objectContaining({ createdById: "user-1" }));
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({ success: true, data: { status: "updated" } });
    expect(next).not.toHaveBeenCalled();
  });
});
