import type { AutomationApprovalDecision } from "@prisma/client";
import { AutomationExecutionGuard } from "../guard.js";
import { env } from "../../../config/env.js";

const BASE_APPROVAL: Partial<AutomationApprovalDecision> = {
  id: "approval-1",
  suggestionId: "suggestion-1",
  status: "APPROVED",
  snapshotHash: "snapshot-123",
  environment: env.NODE_ENV,
  approvedById: "user-1",
  approvedAt: new Date("2024-01-01T00:00:00Z"),
  expiresAt: new Date(Date.now() + 60 * 1000),
  revokedAt: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
};

const buildApproval = (overrides?: Partial<AutomationApprovalDecision>) => {
  return { ...BASE_APPROVAL, ...overrides } as AutomationApprovalDecision;
};

const buildKillSwitchMock = () => ({
  ensureApprovalAllowed: jest.fn(async () => undefined),
});

const buildGuard = (
  approval: AutomationApprovalDecision | null,
  killSwitch = buildKillSwitchMock(),
) => {
  const repository = {
    getApprovalDecisionById: jest.fn(async () => approval),
  };
  return new AutomationExecutionGuard(repository, killSwitch);
};

const guardInput = {
  approvalDecisionId: "approval-1",
  suggestionId: "suggestion-1",
  snapshotHash: "snapshot-123",
  correlationId: "cid-1",
};

describe("AutomationExecutionGuard", () => {
  const initialFlag = env.AUTOMATION_EXECUTION_ENABLED;

  beforeEach(() => {
    env.AUTOMATION_EXECUTION_ENABLED = true;
  });

  afterAll(() => {
    env.AUTOMATION_EXECUTION_ENABLED = initialFlag;
  });

  it("rejects when the feature flag is disabled", async () => {
    env.AUTOMATION_EXECUTION_ENABLED = false;
    const guard = buildGuard(buildApproval());
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 403 });
  });

  it("rejects when an approval decision is missing", async () => {
    const guard = buildGuard(null);
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the approval status is not approved", async () => {
    const guard = buildGuard(buildApproval({ status: "PENDING" as const }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the suggestion id mismatches", async () => {
    const guard = buildGuard(buildApproval({ suggestionId: "other" }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the snapshot hash mismatches", async () => {
    const guard = buildGuard(buildApproval({ snapshotHash: "other-hash" }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the approval is revoked", async () => {
    const guard = buildGuard(buildApproval({ revokedAt: new Date() }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the approval is expired", async () => {
    const guard = buildGuard(buildApproval({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the environment mismatches the runtime", async () => {
    const guard = buildGuard(buildApproval({ environment: "production" }));
    await expect(guard.ensureApprovalExecutable(guardInput)).rejects.toMatchObject({ status: 409 });
  });
});
