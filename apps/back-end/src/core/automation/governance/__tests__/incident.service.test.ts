import type { Prisma } from "@prisma/client";
import { AutomationIncidentService } from "../incident.service.js";

describe("AutomationIncidentService", () => {
  const repository = {
    createIncident: jest.fn(),
    getIncidentById: jest.fn(),
    updateIncident: jest.fn(),
  };

  const service = new AutomationIncidentService(repository as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an incident and stores metadata", async () => {
    repository.createIncident.mockResolvedValue({
      incidentId: "inc-1",
      type: "AUTOMATION_FAILURE",
      severity: "HIGH",
      status: "OPEN",
      relatedExecutionId: "exec-1",
    });

    await service.createIncident({
      incidentType: "AUTOMATION_FAILURE",
      severity: "HIGH",
      relatedExecutionId: "exec-1",
      detectedBy: "SYSTEM",
      description: "failure",
      metadata: { errorCode: "E" } as Prisma.InputJsonValue,
    });

    expect(repository.createIncident).toHaveBeenCalled();
  });

  it("marks an OPEN incident as MITIGATED", async () => {
    repository.getIncidentById.mockResolvedValue({
      incidentId: "inc-1",
      status: "OPEN",
    });
    repository.updateIncident.mockResolvedValue({
      incidentId: "inc-1",
      status: "MITIGATED",
    });

    await service.markMitigated("inc-1", "mitigated");

    expect(repository.updateIncident).toHaveBeenCalledWith("inc-1", expect.objectContaining({ status: "MITIGATED" }));
  });

  it("throws when trying to mitigate a non-OPEN incident", async () => {
    repository.getIncidentById.mockResolvedValue({
      incidentId: "inc-2",
      status: "RESOLVED",
    });

    await expect(service.markMitigated("inc-2")).rejects.toThrow();
  });

  it("resolves a MITIGATED incident", async () => {
    repository.getIncidentById.mockResolvedValue({
      incidentId: "inc-3",
      status: "MITIGATED",
    });

    await service.markResolved("inc-3", "done");

    expect(repository.updateIncident).toHaveBeenCalledWith("inc-3", expect.objectContaining({ status: "RESOLVED" }));
  });
});
