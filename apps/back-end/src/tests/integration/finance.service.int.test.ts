import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForFinanceServiceIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForFinanceServiceIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let financeService: any;
    let publish: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      financeService = (await import("../../modules/finance/finance.service.js")).financeService;
      publish = (await import("../../core/events/event-bus.js")).publish;
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("FinanceService Integration", () => {
      it("creates and persists a finance record, emits event", async () => {
        const input = { amount: 1000, currency: "USD" };
        const created = await financeService.create(input);
        expect(created.amount).toBe(input.amount);
        expect(created.currency).toBe(input.currency);
        const found = await financeService.getById(created.id);
        expect(found).not.toBeNull();
        expect(found.amount).toBe(input.amount);
        expect(publish).toHaveBeenCalled();
      });

      it("updates a finance record and persists changes", async () => {
        const input = { amount: 500, currency: "USD" };
        const created = await financeService.create(input);
        const update = { amount: 750 };
        const updated = await financeService.update(created.id, update);
        expect(updated.amount).toBe(750);
        const found = await financeService.getById(created.id);
        expect(found.amount).toBe(750);
      });
    });
  });
}
