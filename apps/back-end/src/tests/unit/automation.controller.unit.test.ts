import { jest } from "@jest/globals";
import { automationService } from "../../modules/automation/automation.service.js";
import { update } from "../../modules/automation/automation.controller.js";

/**
 * RBAC mock — defined INSIDE jest.mock (ESM-safe)
 */
jest.mock("../../core/security/rbac.js", () => ({
  getUserPermissions: jest.fn(),
}));

// ⬇️ سحب الـ mock بعد الـ jest.mock
import { getUserPermissions } from "../../core/security/rbac.js";

const mockGetUserPermissions =
  getUserPermissions as jest.MockedFunction<() => Promise<string[]>>;

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

function createMockReq() {
  return {
    user: {
      id: "user-1",
      role: "BRAND_OPERATOR",
      brandId: "brand-1",
      tenantId: "tenant-1",
    },
    params: { id: basePayload.ruleId },
    body: { ...basePayload },
  };
}

function createMockRes() {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;

  res.status = jest.fn((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json = jest.fn((payload: unknown) => {
    res.body = payload;
    return payload;
  });

  return res;
}

describe("automation.controller.update", () => {
  let updateSpy: ReturnType<typeof jest.spyOn>;

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

    await update(req as any, res as any, next);

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

  it("allows activation when permission present", async () => {
    mockGetUserPermissions.mockResolvedValue([
      "automation:rules:activate",
    ]);

    updateSpy.mockResolvedValue({ status: "updated" } as any);

    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    await update(req as any, res as any, next);

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
