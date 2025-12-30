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

const mockRequirePermission = jest.fn((permissions: string | string[]) => () => undefined);

jest.mock("../../modules/operator-audit/operator-audit.service.js", () => ({
  operatorAuditService: mockOperatorService,
}));

jest.mock("../../core/security/rbac.js", () => ({
  ...jest.requireActual<typeof import("../../core/security/rbac.js")>("../../core/security/rbac.js"),
  requirePermission: mockRequirePermission,
}));

import { operatorAuditRouter } from "../../modules/operator-audit/index.js";
import { listSnapshots } from "../../modules/operator-audit/operator-audit.controller.js";
void operatorAuditRouter;

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
    const res = { json: jest.fn() } as any;
    const req = {
      user: { id: "u1", role: "BRAND_OPERATOR", brandId: "brand-x", permissions: ["audit:read"] },
      query: { brandId: "other" },
    } as any;
    await listSnapshots(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(mockOperatorService.listSnapshots).not.toHaveBeenCalled();
    const error = next.mock.calls[0][0];
    expect(error?.status).toBe(403);
  });
});
