import { describe, it, test, expect } from "@jest/globals";
import { jest } from "@jest/globals";
import type { Request, Response, NextFunction } from "express";

/* ------------------------------------------------------------------ */
/* Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockOperatorService = {
  listSnapshots: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  listSuggestions: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  listApprovals: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  listExecutions: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  listIncidents: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  listRollbacks: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 25 }),
  getApprovalDetail: jest.fn(),
  getExecutionDetail: jest.fn(),
};
// ...existing code...
const mockRequirePermission = jest.fn(
  (_permission: string) => (_req: Request, _res: Response, next: NextFunction) => next(),
);

/* ------------------------------------------------------------------ */
/* Loaded modules                                                      */
/* ------------------------------------------------------------------ */

let operatorAuditRouter: unknown;
let listSnapshots: (req: Request, res: Response, next: NextFunction) => Promise<void>;

/* ------------------------------------------------------------------ */
    "../../modules/operator-audit/operator-audit.controller"
/* ------------------------------------------------------------------ */

beforeAll(async () => {
  mockRequirePermission.mockClear();

  await jest.unstable_mockModule(
    "../../modules/operator-audit/operator-audit.service.js",
    () => ({
      operatorAuditService: mockOperatorService,
    }),
  );

  await jest.unstable_mockModule("../../core/security/rbac.js", () => ({
    requirePermission: mockRequirePermission,
  }));

  const indexModule = await import("../../modules/operator-audit/index.js");
  operatorAuditRouter = indexModule.operatorAuditRouter;

  const controllerModule = await import(
    "../../modules/operator-audit/operator-audit.controller.js"
  );

  listSnapshots = controllerModule.listSnapshots;
});

/* ensure router side-effects execute */
void operatorAuditRouter;

/* ------------------------------------------------------------------ */
/* Tests                                                              */
/* ------------------------------------------------------------------ */

describe("Operator audit router", () => {
  it("attaches audit, approval, automation, and incident guards", () => {
    expect(mockRequirePermission).toHaveBeenCalledWith("audit:read");
    expect(mockRequirePermission).toHaveBeenCalledWith("ai:approvals:read");
    expect(mockRequirePermission).toHaveBeenCalledWith("automation:read");
    expect(mockRequirePermission).toHaveBeenCalledWith("incident:read");
  });
});

describe("Brand scoping", () => {
  it("rejects mismatched brand filters before hitting the service", async () => {
    const next = jest.fn();
    const res = { json: jest.fn() } as unknown as Response;

    const req = {
      user: {
        id: "u1",
        role: "BRAND_OPERATOR",
        brandId: "brand-x",
        permissions: ["audit:read"],
      },
      query: { brandId: "other" },
    } as unknown as Request;

    await listSnapshots(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(mockOperatorService.listSnapshots).not.toHaveBeenCalled();

    const error = next.mock.calls[0][0];
    expect(error?.status).toBe(403);
  });
});
