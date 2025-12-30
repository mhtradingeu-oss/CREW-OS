import { env } from "../../../../core/config/env.js";
import type { AIReadOnlySnapshot } from "../ai-read-only.types.js";
import { aiReadOnlySnapshotService } from "../ai-read-only.service.js";
import * as snapshotBuilder from "../ai-read-only.snapshot.js";
import {
  enforceReadOnlyMutation,
  runReadOnlySnapshot,
} from "../../../../core/prisma-read-only-guard.js";

const DEFAULTS = {
  enabled: env.AI_READ_ONLY_ENABLED,
  maxRows: env.AI_READ_ONLY_MAX_ROWS,
  maxPayload: env.AI_READ_ONLY_MAX_PAYLOAD_BYTES,
  timeout: env.AI_READ_ONLY_TIMEOUT_MS,
};

describe("AI read-only snapshot service", () => {
  beforeEach(() => {
    env.AI_READ_ONLY_ENABLED = true;
    aiReadOnlySnapshotService.clearCache();
  });

  afterEach(() => {
    env.AI_READ_ONLY_ENABLED = DEFAULTS.enabled;
    env.AI_READ_ONLY_MAX_ROWS = DEFAULTS.maxRows;
    env.AI_READ_ONLY_MAX_PAYLOAD_BYTES = DEFAULTS.maxPayload;
    env.AI_READ_ONLY_TIMEOUT_MS = DEFAULTS.timeout;
    jest.restoreAllMocks();
  });

  it("blocks mutations when the read-only guard is active", async () => {
    await expect(
      runReadOnlySnapshot(async () => {
        enforceReadOnlyMutation("create");
      }),
    ).rejects.toThrow("read-only snapshot");
  });

  it("builds deterministic snapshots for the same inputs", async () => {
    const snapshotA = await snapshotBuilder.buildAIReadOnlySnapshot({ brandId: "brand-x" });
    const snapshotB = await snapshotBuilder.buildAIReadOnlySnapshot({ brandId: "brand-x" });
    expect(snapshotA.snapshotHash).toBe(snapshotB.snapshotHash);
    expect(snapshotA.generatedAt.toISOString()).toBe(snapshotB.generatedAt.toISOString());
    expect(snapshotA.events.moduleBreakdown).toEqual(snapshotB.events.moduleBreakdown);
  });

  it("enforces the configured row limit and fails closed", async () => {
    env.AI_READ_ONLY_MAX_ROWS = 1;
    await expect(aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" })).rejects.toThrow(
      /row limit/i,
    );
  });

  it("enforces the configured payload limit and fails closed", async () => {
    env.AI_READ_ONLY_MAX_PAYLOAD_BYTES = 1;
    await expect(aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" })).rejects.toThrow(
      /payload size/i,
    );
  });

  it("times out when snapshot generation exceeds the configured limit", async () => {
    env.AI_READ_ONLY_TIMEOUT_MS = 1;
    const stub = jest
      .spyOn(snapshotBuilder, "buildAIReadOnlySnapshot")
      .mockImplementation(() => new Promise<AIReadOnlySnapshot>(() => {}));

    await expect(aiReadOnlySnapshotService.fetchSnapshot({ brandId: "brand-x" })).rejects.toThrow(
      /timed out/i,
    );

    stub.mockRestore();
  });
});
