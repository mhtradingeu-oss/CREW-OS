import { prisma } from "@/core/prisma";
import { marketingService } from "../../modules/marketing/marketing.service.js";
import { knowledgeBaseService } from "../../modules/knowledge-base/knowledge-base.service.js";
import type { CampaignRecord } from "../../modules/marketing/marketing.types.js";

describe("Marketing execution workflow integration", () => {
  const dbUrl = process.env.DATABASE_URL_TEST;
  if (!dbUrl) {
    it("skips: DATABASE_URL_TEST not set", () => {
      console.warn("Skipping marketing workflow integration because DATABASE_URL_TEST is not configured");
    });
    return;
  }

  it("creates a campaign, logs execution with metrics, and surfaces performance + content data", async () => {
    const slug = `marketing-workflow-${Date.now()}`;
    const brand = await prisma.brand.create({
      data: {
        name: slug,
        slug,
      },
    });
    let campaign: CampaignRecord | undefined;
    try {
      campaign = await marketingService.create(
        {
          name: "Workflow test campaign",
          brandId: brand.id,
          status: "active",
        },
        { brandId: brand.id },
      );
      const executedAt = new Date();
      const execution = await marketingService.recordCampaignExecution(
        campaign.id,
        {
          type: "publish",
          executedAt,
          contentTitle: "Marketing OS Launch",
          content: "Integration validation entry",
          impressions: 120,
          clicks: 12,
          spend: 30,
          conversions: 2,
          revenue: 150,
        },
        { brandId: brand.id },
      );

      expect(execution.campaignId).toBe(campaign.id);
      expect(execution.contentDocumentId).toBeTruthy();

      const performance = await marketingService.getCampaignPerformance(campaign.id, { brandId: brand.id }, 10);
      expect(performance.campaignId).toBe(campaign.id);
      expect(performance.totals.impressions).toBeGreaterThanOrEqual(120);
      expect(performance.logs.length).toBeGreaterThan(0);
      expect(performance.lastLoggedAt).toBeInstanceOf(Date);

      const docs = await knowledgeBaseService.listDocuments({
        brandId: brand.id,
        campaignId: campaign.id,
      });
      expect(docs.items.some((doc) => doc.title === "Marketing OS Launch")).toBe(true);
    } finally {
      if (campaign) {
        await prisma.marketingPerformanceLog.deleteMany({ where: { campaignId: campaign.id } });
        await prisma.knowledgeDocument.deleteMany({ where: { campaignId: campaign.id } });
        await prisma.campaign.delete({ where: { id: campaign.id } });
      }
      await prisma.activityLog.deleteMany({ where: { brandId: brand.id } });
      await prisma.brand.delete({ where: { id: brand.id } });
    }
  });
});
