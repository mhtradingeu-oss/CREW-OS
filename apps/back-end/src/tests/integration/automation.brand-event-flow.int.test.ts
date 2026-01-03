import { Prisma } from "@prisma/client";
import { initEventHub } from "../../bootstrap/event-hub.js";
import { automationService } from "../../modules/automation/automation.service.js";
import { brandService } from "../../modules/brand/brand.service.js";
import type { EventEnvelope } from "../../core/events/event-bus.js";
import { prisma } from "@/core/prisma";

async function waitForRun(ruleId: string, timeoutMs = 5000): Promise<Prisma.AutomationRun> {
  const intervalMs = 120;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const run = await prisma.automationRun.findFirst({
      where: { ruleId },
      orderBy: { createdAt: "desc" },
    });
    if (run) {
      return run;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Automation run for rule ${ruleId} was not created in time`);
}

function parseJson<T = Record<string, unknown>>(value: Prisma.JsonValue | null | undefined): T | null {
  if (value === null || typeof value === "undefined") return null;
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}

describe("Automation event flow (brand.created)", () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it("skips: DATABASE_URL_TEST not set", () => {
      console.warn("Skipping brand event automation integration because DATABASE_URL_TEST is not configured");
    });
    return;
  }

  beforeAll(() => {
    initEventHub();
  });

  it("consumes a real brand.created event, logs a run, and deduplicates duplicates", async () => {
    const brandName = `Automation Flow ${Date.now()}`;
    const brandSlug = `automation-event-${Date.now()}`;

    const ruleRecord = await automationService.create({
      name: "Brand created trigger",
      description: "Runs when a brand with a known name is created",
      brandId: null,
    });
    await automationService.update(ruleRecord.id, {
      triggerEvent: "brand.created",
      conditionConfigJson: {
        any: [{ path: "payload.name", op: "eq", value: brandName }],
      },
      actionsConfigJson: { actions: [{ type: "log" }] },
    });

    let createdBrandId: string | undefined;
    try {
      const brand = await brandService.create(
        { name: brandName, slug: brandSlug },
        { role: "SUPER_ADMIN", actorUserId: "automation-integration" },
      );
      createdBrandId = brand.id;

      const run = await waitForRun(ruleRecord.id);
      expect(run.eventName).toBe("brand.created");
      expect(run.status).toBe("SUCCESS");

      const summary = parseJson<{ correlationId: string | null }>(run.summaryJson);
      expect(summary?.correlationId).toBeTruthy();

      const logEntry = await prisma.automationLog.findFirst({
        where: { ruleId: ruleRecord.id, eventName: "brand.created" },
        orderBy: { createdAt: "desc" },
      });
      expect(logEntry).toBeDefined();
      const logDetails = parseJson<{ eventId?: string; correlationId?: string }>(logEntry?.detailsJson);
      expect(logDetails?.eventId).toBe(run.eventId);
      expect(logDetails?.correlationId).toBe(summary?.correlationId ?? null);

      const parsedPayload = parseJson<Record<string, unknown>>(run.triggerEventJson) ?? {};
      const dedupEvent: EventEnvelope = {
        id: run.eventId ?? `dedup-${Date.now()}`,
        name: run.eventName,
        payload: parsedPayload,
        context: {
          brandId: brand.id,
          tenantId: brand.tenantId ?? undefined,
          correlationId: summary?.correlationId ?? undefined,
        },
        occurredAt: new Date(),
      };

      const dedupResults = await automationService.handleEvent(dedupEvent);
      expect(dedupResults).toHaveLength(1);
      expect(dedupResults[0]?.skipped).toBe(true);
      expect(dedupResults[0]?.runId).toBe(run.id);

      const runsAfter = await prisma.automationRun.count({ where: { ruleId: ruleRecord.id } });
      expect(runsAfter).toBe(1);
    } finally {
      await prisma.automationLog.deleteMany({ where: { ruleId: ruleRecord.id } });
      await automationService.remove(ruleRecord.id).catch(() => undefined);
      if (createdBrandId) {
        await prisma.brand.delete({ where: { id: createdBrandId } }).catch(() => undefined);
      }
    }
  });
});
