import { describe, it, test, expect } from "@jest/globals";
const hasValidDbUrlForAiSuggestionRoutesIntTest =
  typeof process.env.DATABASE_URL_TEST === "string" &&
  (process.env.DATABASE_URL_TEST.startsWith("postgres://") ||
    process.env.DATABASE_URL_TEST.startsWith("postgresql://"));

if (!hasValidDbUrlForAiSuggestionRoutesIntTest) {
  describe("integration skipped", () => {
    test.skip("skipped because DATABASE_URL_TEST is not configured", () => {
      console.warn("Skipping integration test: DATABASE_URL_TEST not set");
    });
  });
} else {
  describe("integration", () => {
    let prisma: any;
    let listSuggestions: any;
    let approveSuggestion: any;
    let Router: any;
    let express: any;
    let request: any;

    beforeAll(async () => {
      prisma = (await import("../../core/prisma.js")).prisma;
      const controller = await import("../../modules/ai-suggestions/ai-suggestion.controller.js");
      listSuggestions = controller.listSuggestions;
      approveSuggestion = controller.approveSuggestion;
      const expressModule = await import("express");
      Router = expressModule.Router;
      express = expressModule.default;
      request = (await import("supertest")).default;
    });

    afterAll(async () => {
      if (prisma?.$disconnect) {
        await prisma.$disconnect();
      }
    });

    function withUser(user: any) {
      return (req: any, _res: any, next: () => void) => {
        if (user) req.user = user;
        next();
      };
    }

    function createTestRouter() {
      const testRouter = Router();
      testRouter.get("/", listSuggestions);
      testRouter.post(":id/approve", approveSuggestion);
      return testRouter;
    }

    function createTestApp(user: any) {
      const app = express();
      app.use(express.json());
      app.use(withUser(user));
      app.use("/api/v1/ai-suggestions", createTestRouter());
      return app;
    }

    it("placeholder to satisfy Jest", () => {
      expect(true).toBe(true);
    });

    it("approves suggestion for authorized user", async () => {
      const suggestionId = "suggestion-1";
      const app = createTestApp({ id: "admin-1", role: "MANAGER" });
      const res = await request(app).post(`/api/v1/ai-suggestions/${suggestionId}/approve`).send();
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("approved");
    });
  });
}
