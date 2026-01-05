import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForPrismaIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForPrismaIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    describe("Prisma integration (real DB)", () => {
      it("can connect and run SELECT 1", async () => {
        const result = await prisma.$queryRaw`SELECT 1 as one`;
        expect(result[0]?.one || result[0]?.ONE).toBe(1);
      });
    });
  });
}
