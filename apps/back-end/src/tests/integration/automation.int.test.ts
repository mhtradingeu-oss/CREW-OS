import { automationService } from "../../modules/automation/automation.service.js";
import { prisma } from "@/core/prisma";

describe("AutomationService integration", () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it("skips: DATABASE_URL_TEST not set", () => {
      console.warn("Skipping automation integration test because DATABASE_URL_TEST is not configured");
    });
    return;
  }

  it("creates a rule, emits the matching event, and records a run", async () => {
    const slug = `automation-gate-${Date.now()}`;
    const brand = await prisma.brand.create({
      data: {
        name: slug,
        slug,
      },
    });

    let ruleId: string | undefined;
    try {
      const rule = await automationService.create({
        name: "Integration automation",
        description: "Runs on test events",
        brandId: brand.id,
      });
      ruleId = rule.id;

      await automationService.update(ruleId, {
        triggerEvent: "automation.integration.event",
        conditionConfigJson: {
          any: [{ path: "payload.hello", op: "eq", value: "world" }],
        },
        actionsConfigJson: { actions: [{ type: "log" }] },
      });

      const event = {
        id: `integration-${Date.now()}`,
        name: "automation.integration.event",
        payload: { hello: "world" },
        context: { brandId: brand.id, correlationId: "cid-integration" },
        occurredAt: new Date(),
      };

      const results = await automationService.handleEvent(event);
      expect(results.length).toBeGreaterThanOrEqual(1);

      const run = await prisma.automationRun.findFirst({
        where: { ruleId },
        orderBy: { createdAt: "desc" },
      });
      expect(run?.status).toBe("SUCCESS");
    } finally {
      if (ruleId) {
        await automationService.remove(ruleId).catch(() => undefined);
      }
      await prisma.brand.delete({ where: { id: brand.id } });
    }
  });
});
