import type { AIReadOnlySnapshot } from "../ai-read-only.types.js";

describe("AI read-only snapshot service", () => {
  const DEFAULTS = { ...process.env };

  beforeEach(async () => {
    jest.resetModules();

    process.env.AI_READ_ONLY_ENABLED = "true";
    process.env.AI_READ_ONLY_MAX_ROWS = "1000";
    process.env.AI_READ_ONLY_MAX_PAYLOAD_BYTES = "1048576";
    process.env.AI_READ_ONLY_TIMEOUT_MS = "5000";
  });

  afterEach(() => {
    process.env = { ...DEFAULTS };
    jest.restoreAllMocks();
  });

  it("blocks mutations when the read-only guard is active", async () => {
    const {
      enforceReadOnlyMutation,
      runReadOnlySnapshot,
    } = await import("../../../../core/prisma-read-only-guard.js");

    await expect(
      runReadOnlySnapshot(async () => {
        enforceReadOnlyMutation("create");
      }),
    ).rejects.toThrow("read-only snapshot");
  });

  it("builds deterministic snapshots for the same inputs", async () => {
    const snapshotBuilder = await import("../ai-read-only.snapshot.js");

    const snapshotA = await snapshotBuilder.buildAIReadOnlySnapshot({
      brandId: "brand-x",
    });
    const snapshotB = await snapshotBuilder.buildAIReadOnlySnapshot({
      brandId: "brand-x",
    });

    expect(snapshotA.snapshotHash).toBe(snapshotB.snapshotHash);
    expect(snapshotA.generatedAt.toISOString()).toBe(
      snapshotB.generatedAt.toISOString(),
    );
    expect(snapshotA.events.moduleBreakdown).toEqual(
      snapshotB.events.moduleBreakdown,
    );
  });

  it("enforces the configured row limit and fails closed", async () => {
    process.env.AI_READ_ONLY_MAX_ROWS = "1";

    const { aiReadOnlySnapshotService } = await import(
      "../ai-read-only.service.js"
    );

    await expect(
      aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" }),
    ).rejects.toThrow(/row limit/i);
  });

  it("enforces the configured payload limit and fails closed", async () => {
    process.env.AI_READ_ONLY_MAX_PAYLOAD_BYTES = "1";

    const { aiReadOnlySnapshotService } = await import(
      "../ai-read-only.service.js"
    );

    await expect(
      aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" }),
    ).rejects.toThrow(/payload size/i);
  });

  it("times out when snapshot generation exceeds the configured limit", async () => {
    process.env.AI_READ_ONLY_TIMEOUT_MS = "1";

    const snapshotBuilder = await import("../ai-read-only.snapshot.js");
    const { aiReadOnlySnapshotService } = await import(
      "../ai-read-only.service.js"
    );

    const stub = jest
      .spyOn(snapshotBuilder, "buildAIReadOnlySnapshot")
      .mockImplementation(
        () => new Promise<AIReadOnlySnapshot>(() => {}),
      );

    await expect(
      aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" }),
    ).rejects.toThrow(/timed out/i);

    stub.mockRestore();
  });
});
