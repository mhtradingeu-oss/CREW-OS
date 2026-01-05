import { describe, it, test, expect } from "@jest/globals";

import { env } from "../../../config/env.js";
import { AutomationRollbackService } from "../rollback.service.js";

const buildExecution = (overrides?: Partial<{ result: string; executedAt: Date }>) => ({
  id: "exec-1",
  result: "FAILED",
  executedAt: new Date(),
  ...overrides,
});

describe("AutomationRollbackService", () => {
  const governanceRepository = {
    getRollbackByExecutionId: jest.fn(),
    createRollbackExecution: jest.fn(),
    getRollbackById: jest.fn(),
    updateRollbackExecution: jest.fn(),
  };
  const executionRepository = {
    getExecutionById: jest.fn(),
  };
  const incidentService = {
    getIncidentById: jest.fn(),
    markMitigated: jest.fn(),
    markResolved: jest.fn(),
  };

  const service = new AutomationRollbackService(
    governanceRepository as any,
    executionRepository as any,
    incidentService as any,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    env.AUTOMATION_ROLLBACK_WINDOW_MINUTES = 60;
  });

  it("rejects when the execution record is missing", async () => {
    executionRepository.getExecutionById.mockResolvedValue(null);
    await expect(
      service.requestRollback({
        executionId: "missing",
        incidentId: "inc-1",
        approvedById: "user",
        reason: "reason",
        snapshotReference: "snap",
        scopeDescription: "scope",
      }),
    ).rejects.toThrow(/Original execution not found/);
  });

  it("rejects when the execution window has expired", async () => {
    const stale = buildExecution({ executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) });
    executionRepository.getExecutionById.mockResolvedValue(stale);
    await expect(
      service.requestRollback({
        executionId: "exec-1",
        incidentId: "inc-1",
        approvedById: "user",
        reason: "reason",
        snapshotReference: "snap",
        scopeDescription: "scope",
      }),
    ).rejects.toThrow(/Rollback window has expired/);
  });

  it("rejects when an incident is missing", async () => {
    executionRepository.getExecutionById.mockResolvedValue(buildExecution());
    incidentService.getIncidentById.mockResolvedValue(null);
    await expect(
      service.requestRollback({
        executionId: "exec-1",
        incidentId: "inc-1",
        approvedById: "user",
        reason: "reason",
        snapshotReference: "snap",
        scopeDescription: "scope",
      }),
    ).rejects.toThrow(/Incident missing/);
  });

  it("rejects an incident that is not OPEN", async () => {
    executionRepository.getExecutionById.mockResolvedValue(buildExecution());
    incidentService.getIncidentById.mockResolvedValue({ incidentId: "inc-2", status: "MITIGATED" });
    await expect(
      service.requestRollback({
        executionId: "exec-1",
        incidentId: "inc-2",
        approvedById: "user",
        reason: "reason",
        snapshotReference: "snap",
        scopeDescription: "scope",
      }),
    ).rejects.toThrow(/Rollback requires an OPEN incident/);
  });

  it("rejects when a rollback already exists", async () => {
    executionRepository.getExecutionById.mockResolvedValue(buildExecution());
    incidentService.getIncidentById.mockResolvedValue({ incidentId: "inc-3", status: "OPEN" });
    governanceRepository.getRollbackByExecutionId.mockResolvedValue({ id: "rb-1" });
    await expect(
      service.requestRollback({
        executionId: "exec-1",
        incidentId: "inc-3",
        approvedById: "user",
        reason: "reason",
        snapshotReference: "snap",
        scopeDescription: "scope",
      }),
    ).rejects.toThrow(/Rollback already recorded/);
  });

  it("creates a rollback when eligibility checks pass", async () => {
    executionRepository.getExecutionById.mockResolvedValue(buildExecution());
    incidentService.getIncidentById.mockResolvedValue({ incidentId: "inc-4", status: "OPEN" });
    governanceRepository.getRollbackByExecutionId.mockResolvedValue(null);
    governanceRepository.createRollbackExecution.mockResolvedValue({ id: "rb-1" });

    await service.requestRollback({
      executionId: "exec-1",
      incidentId: "inc-4",
      approvedById: "user",
      reason: "reason",
      snapshotReference: "snap",
      scopeDescription: "scope",
      metadata: { detail: "info" },
    });

    expect(governanceRepository.createRollbackExecution).toHaveBeenCalled();
    expect(incidentService.markMitigated).toHaveBeenCalledWith("inc-4", "Rollback approved");
  });

  it("finalizes a rollback and resolves the incident", async () => {
    governanceRepository.getRollbackById.mockResolvedValue({
      id: "rb-1",
      status: "PENDING",
      executionId: "exec-1",
      incidentId: "inc-5",
    });
    governanceRepository.updateRollbackExecution.mockResolvedValue({
      id: "rb-1",
      status: "EXECUTED",
      executionId: "exec-1",
      incidentId: "inc-5",
    });

    await service.finalizeRollback({ rollbackId: "rb-1", status: "EXECUTED" });

    expect(governanceRepository.updateRollbackExecution).toHaveBeenCalled();
    expect(incidentService.markResolved).toHaveBeenCalledWith("inc-5", undefined);
  });

  it("rejects finalizing a rollback twice", async () => {
    governanceRepository.getRollbackById.mockResolvedValue({
      id: "rb-1",
      status: "EXECUTED",
    });

    await expect(
      service.finalizeRollback({ rollbackId: "rb-1", status: "EXECUTED" }),
    ).rejects.toThrow(/Only pending rollbacks can be finalized/);
  });
});
