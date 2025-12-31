import type { Prisma } from "@prisma/client";
import { initEventHub } from "../../bootstrap/event-hub.js";
import { automationService } from "../../modules/automation/automation.service.js";
import { marketingService } from "../../modules/marketing/marketing.service.js";
import { MarketingDomainEvents } from "../../modules/marketing/marketing.events.js";
import { publishDomainEvent } from "../../core/events/event-bus.js";
import type { DomainEventPayloadMap } from "../../core/events/domain/types.js";
import { prisma } from "@/core/prisma";

describe("Marketing → Sales automation flow", () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it("skips: DATABASE_URL_TEST not set", () => {
      console.warn("Skipping marketing→sales automation integration because DATABASE_URL_TEST is not configured");
    });
    return;
  }

  beforeAll(() => {
    initEventHub();
  });

  it("fires an automation that creates a CRM task, logs the run, and deduplicates duplicate events", async () => {
    const slug = `marketing-sales-${Date.now()}`;
    const brand = await prisma.brand.create({
      data: {
        name: slug,
        slug,
      },
    });

    let ruleId: string | undefined;
    let campaignId: string | undefined;

    try {
      const ruleRecord = await automationService.create({
        name: "Marketing execution → Sales task",
        description: "Create a CRM task when a campaign reports conversions",
        brandId: brand.id,
      });
      ruleId = ruleRecord.id;
      await automationService.update(ruleId, {
        triggerEvent: MarketingDomainEvents.CAMPAIGN_EXECUTION_RECORDED,
        conditionConfigJson: {
          any: [{ path: "payload.metrics.conversions", op: "gt", value: 0 }],
        },
        actionsConfigJson: {
          actions: [
            {
              type: "CRM_TASK_FROM_MARKETING_EXECUTION",
              params: {
                titleTemplate: "Follow up on {{campaignName}} ({{action}})",
                status: "open",
                dueInMinutes: 45,
              },
            },
          ],
        },
      });

      const campaign = await marketingService.create(
        {
          name: "Marketing → Sales demo",
          brandId: brand.id,
          status: "active",
        },
        { brandId: brand.id },
      );
      campaignId = campaign.id;

      await marketingService.recordCampaignExecution(
        campaign.id,
        {
          type: "publish",
          executedAt: new Date(),
          contentTitle: "Conversion-powered outreach",
          content: "Marketing event triggers a sales task",
          impressions: 500,
          clicks: 48,
          spend: 120,
          conversions: 2,
          revenue: 900,
        },
        { brandId: brand.id },
      );

      const firstRun = await waitForAutomationRun(ruleId);
      expect(firstRun.status).toBe("SUCCESS");

      const firstSummary = parseJson(firstRun.summaryJson);
      const firstAction = firstSummary?.actions?.[0];
      expect(firstAction?.status).toBe("SUCCESS");
      expect(firstAction?.result?.taskId).toBeTruthy();

      const task = await prisma.crmTask.findFirst({
        where: { brandId: brand.id },
        orderBy: { createdAt: "desc" },
      });
      expect(task).toBeDefined();
      expect(task?.status).toBe("open");
      expect(task?.title?.toLowerCase()).toContain("marketing");

      const logEntry = await prisma.automationLog.findFirst({
        where: { ruleId },
        orderBy: { createdAt: "desc" },
      });
      expect(logEntry).toBeDefined();
      const logDetails = parseJson(logEntry?.detailsJson);
      expect(logDetails?.runId).toBe(firstRun.id);

      const eventPayload = (parseJson(firstRun.triggerEventJson) ?? {}) as DomainEventPayloadMap["marketing.campaign.execution.recorded"];
      const recordedEventId = firstSummary?.event?.id;
      if (!recordedEventId) throw new Error("Expected campaign execution event id");

      await publishDomainEvent({
        type: MarketingDomainEvents.CAMPAIGN_EXECUTION_RECORDED,
        payload: eventPayload,
        meta: { brandId: brand.id },
        id: recordedEventId,
      });

      const secondRun = await waitForAutomationRun(ruleId, { excludeId: firstRun.id, since: firstRun.createdAt ?? new Date() });
      const secondSummary = parseJson(secondRun.summaryJson);
      const secondAction = secondSummary?.actions?.[0];
      expect(secondAction?.status).toBe("SKIPPED");
      expect(secondAction?.deduped).toBe(true);
    } finally {
      if (ruleId) {
        await prisma.automationLog.deleteMany({ where: { ruleId } });
        await automationService.remove(ruleId).catch(() => undefined);
      }
      await prisma.crmTask.deleteMany({ where: { brandId: brand.id } });
      if (campaignId) {
        await prisma.marketingPerformanceLog.deleteMany({ where: { campaignId } });
        await prisma.knowledgeDocument.deleteMany({ where: { campaignId } });
        await prisma.campaign.delete({ where: { id: campaignId } }).catch(() => undefined);
      }
      await prisma.activityLog.deleteMany({ where: { brandId: brand.id } });
      await prisma.brand.delete({ where: { id: brand.id } }).catch(() => undefined);
    }
  });
});

async function waitForAutomationRun(
  ruleId: string,
  opts: { excludeId?: string; since?: Date; timeoutMs?: number } = {},
): Promise<Prisma.AutomationRun> {
  const timeoutMs = opts.timeoutMs ?? 10000;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const candidate = await prisma.automationRun.findFirst({
      where: {
        ruleId,
        ...(opts.excludeId ? { id: { not: opts.excludeId } } : {}),
        ...(opts.since ? { createdAt: { gt: opts.since } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    if (candidate) {
      return candidate;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`Automation run for rule ${ruleId} did not appear within ${timeoutMs}ms`);
}

function parseJson<T = Record<string, unknown>>(value: unknown): T | null {
  if (value === null || typeof value === "undefined") return null;
  if (typeof value === "string") {
    return JSON.parse(value) as T;
  }
  return value as T;
}
