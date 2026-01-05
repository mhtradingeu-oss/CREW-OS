import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForMarketingWorkflowIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForMarketingWorkflowIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let marketingService: any;
    let knowledgeBaseService: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      marketingService = (await import("../../modules/marketing/marketing.service.js")).marketingService;
      knowledgeBaseService = (await import("../../modules/knowledge-base/knowledge-base.service.js"))
        .knowledgeBaseService;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Marketing execution workflow integration", () => {
      it("creates a campaign, logs execution with metrics, and surfaces performance + content data", async () => {
        const slug = `marketing-workflow-${Date.now()}`;
        const brand = await prisma.brand.create({
          data: {
            name: slug,
            slug,
          },
        });
        let campaign;
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
          });
          const docItems = Array.isArray(docs) ? docs : docs?.items ?? [];
          expect(Array.isArray(docItems)).toBe(true);
          expect(docItems.some((doc: any) => doc.title === "Marketing OS Launch")).toBe(true);
        } finally {
          if (campaign) {
            await prisma.marketingPerformanceLog
              .deleteMany({ where: { campaignId: campaign.id } })
              .catch(() => undefined);
            await prisma.knowledgeDocument.deleteMany({ where: { campaignId: campaign.id } }).catch(() => undefined);
            await prisma.campaign.delete({ where: { id: campaign.id } }).catch(() => undefined);
          }
          await prisma.activityLog.deleteMany({ where: { brandId: brand.id } }).catch(() => undefined);
          await prisma.brand.delete({ where: { id: brand.id } }).catch(() => undefined);
        }
      });
    });
  });
}
