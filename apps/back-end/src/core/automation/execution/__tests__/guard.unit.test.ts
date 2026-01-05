// import removed: ApprovalDecisionWithSuggestion type is not used at runtime
import { describe, it, test, expect } from "@jest/globals";
import { AutomationExecutionGuard } from "../guard.js";
import { env } from "../../../config/env.js";
import { AutomationKillSwitchService } from "../../governance/kill-switch.service.js";
import { forbidden } from "../../../http/errors.js";

/* ------------------------------------------------------------------ */
/* Approval factory                                                    */
/* ------------------------------------------------------------------ */

const BASE_APPROVAL = {
  id: "approval-1",
  suggestionId: "suggestion-1",
  status: "APPROVED",
  snapshotHash: "snapshot-123",
  environment: env.NODE_ENV,
  approvedById: "user-1",
  approvedAt: new Date("2024-01-01T00:00:00Z"),
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-01T00:00:00Z"),
  suggestion: { brandId: "brand-test" },
};

const buildApproval = (overrides = {}) => ({
  ...BASE_APPROVAL,
  ...overrides,
});

/* ------------------------------------------------------------------ */
/* Kill-switch factory (REAL instance, mocked behavior)                */
/* ------------------------------------------------------------------ */

const buildKillSwitch = (): AutomationKillSwitchService => {
  const service = new AutomationKillSwitchService(
    // minimal repository stub – never used by these tests
    {} as any,
  );

  jest.spyOn(service, "ensureApprovalAllowed").mockResolvedValue(undefined);
  jest.spyOn(service, "ensureExecutionAllowed").mockResolvedValue(undefined);
  jest.spyOn(service, "assertGlobalEnabled").mockReturnValue(undefined);

  return service;
};

/* ------------------------------------------------------------------ */
/* Guard factory                                                       */
/* ------------------------------------------------------------------ */

const buildGuard = (
  approval: any | null,
  killSwitch: AutomationKillSwitchService = buildKillSwitch(),
) => {
  const repository = {
    getApprovalDecisionById: jest.fn(async () => approval),
  };

  return new AutomationExecutionGuard(
    repository as any,
    killSwitch,
  );
};

/* ------------------------------------------------------------------ */
/* Test input                                                          */
/* ------------------------------------------------------------------ */

const guardInput = {
  approvalDecisionId: "approval-1",
  suggestionId: "suggestion-1",
  snapshotHash: "snapshot-123",
  correlationId: "cid-1",
};

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

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

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects when an approval decision is missing", async () => {
    const guard = buildGuard(null);

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the approval status is not approved", async () => {
    const guard = buildGuard(buildApproval({ status: "PENDING" }));

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the suggestion id mismatches", async () => {
    const guard = buildGuard(buildApproval({ suggestionId: "other" }));

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({
      status: 409,
      code: "APPROVAL_SUGGESTION_MISMATCH",
    });
  });

  it("rejects when the snapshot hash mismatches", async () => {
    const guard = buildGuard(buildApproval({ snapshotHash: "other-hash" }));

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({
      status: 409,
      code: "SNAPSHOT_MISMATCH",
    });
  });

  it("rejects when the approval is revoked", async () => {
    const guard = buildGuard(buildApproval({ revokedAt: new Date() }));

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the approval is expired", async () => {
    const guard = buildGuard(
      buildApproval({ expiresAt: new Date(Date.now() - 1_000) }),
    );

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects when the environment mismatches the runtime", async () => {
    const guard = buildGuard(buildApproval({ environment: "production" }));

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({
      status: 409,
      code: "ENVIRONMENT_MISMATCH",
    });
  });

  it("rejects when kill switch blocks the approval", async () => {
    const killSwitch = buildKillSwitch();
    jest
      .spyOn(killSwitch, "ensureApprovalAllowed")
      .mockRejectedValue(
        forbidden("blocked", undefined, "AUTOMATION_KILL_SWITCH"),
      );

    const guard = buildGuard(buildApproval(), killSwitch);

    await expect(
      guard.ensureApprovalExecutable(guardInput),
    ).rejects.toMatchObject({
      status: 403,
      code: "AUTOMATION_KILL_SWITCH",
    });
  });
});
