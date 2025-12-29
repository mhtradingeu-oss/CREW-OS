import express, { Router } from "express";
import request from "supertest";
import { jest } from "@jest/globals";

class AISuggestionServiceMock {
    static suggestion = {
      id: "suggestion-1",
      tenantId: "t1",
      brandId: "b1",
      agent: "agent",
      domain: "domain",
      suggestionType: "type",
      riskLevel: "low",
      status: "pending",
      requiredApprovalRole: "MANAGER",
      inputSnapshotJson: "{}",
      proposedOutputJson: "{}",
      correlationId: "corr-3",
      createdAt: new Date(),
      updatedAt: new Date(),
      approvedByUserId: null as string | null,
      approvedAt: null as Date | null,
      failureReason: null,
    };
    repo = {
      listSuggestions: jest.fn(({ filter }) => {
        if (filter?.id === "suggestion-1") {
          return [AISuggestionServiceMock.suggestion];
        }
        // For reject test, return a new suggestion
        if (filter?.id === "suggestion-2") {
          return [{ ...AISuggestionServiceMock.suggestion, id: "suggestion-2", status: "pending" }];
        }
        return [];
      }),
    };
    approveSuggestion = jest.fn((id, userId) => {
      if (id === "suggestion-1") {
        AISuggestionServiceMock.suggestion.status = "approved";
        AISuggestionServiceMock.suggestion.approvedByUserId = userId as string;
        AISuggestionServiceMock.suggestion.approvedAt = new Date();
        return Promise.resolve({ ...AISuggestionServiceMock.suggestion }) as Promise<typeof AISuggestionServiceMock.suggestion>;
      }
      return Promise.resolve(null);
    });
    rejectSuggestion = jest.fn((id, userId, reason) => {
      if (id === "suggestion-2") {
        return Promise.resolve({
          ...AISuggestionServiceMock.suggestion,
          id: "suggestion-2",
          status: "rejected",
          rejectedByUserId: userId as string,
          failureReason: reason,
        });
      }
      return Promise.resolve(null) as Promise<typeof AISuggestionServiceMock.suggestion | null>;
    });
  }

type AISuggestionController = typeof import("../../modules/ai-suggestions/ai-suggestion.controller.js");
let listSuggestions: AISuggestionController["listSuggestions"];
let approveSuggestion: AISuggestionController["approveSuggestion"];
let rejectSuggestion: AISuggestionController["rejectSuggestion"];

beforeAll(async () => {
  const controller: AISuggestionController = await import(
    "../../modules/ai-suggestions/ai-suggestion.controller.js"
  );
  ({ listSuggestions, approveSuggestion, rejectSuggestion } = controller);
});

// Helper middleware to inject req.user
type TestUser = { id: string; role?: string } | undefined;
function withUser(user: TestUser) {
  return (req: any, _res: any, next: any) => {
    if (user) req.user = user;
    next();
  };
}

// Test-only router: same routes, no authenticateRequest
function createTestRouter() {
  const testRouter = Router();
  testRouter.get("/", listSuggestions);
  testRouter.post("/:id/approve", approveSuggestion);
  testRouter.post("/:id/reject", rejectSuggestion);
  return testRouter;
}

function createTestApp(user: TestUser) {
  const app = express();
  app.use(express.json());
  app.use(withUser(user));
  app.use("/api/v1/ai-suggestions", createTestRouter());
  return app;
}

describe("AI Suggestion Approval API", () => {
  const suggestionId = "suggestion-1";

  it("should 401 if user is missing", async () => {
    const app = createTestApp(undefined); // no user injected
    const res = await request(app).post(`/api/v1/ai-suggestions/${suggestionId}/approve`).send();
    expect(res.status).toBe(401);
  });

  it("should 403 for unauthorized user", async () => {
    const app = createTestApp({ id: "user-1", role: "USER" });
    const res = await request(app).post(`/api/v1/ai-suggestions/${suggestionId}/approve`).send();
    expect(res.status).toBe(403);
  });

  it("should approve for authorized user", async () => {
    const app = createTestApp({ id: "admin-1", role: "MANAGER" });
    const res = await request(app).post(`/api/v1/ai-suggestions/${suggestionId}/approve`).send();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("should be idempotent on double approval", async () => {
    const app = createTestApp({ id: "admin-1", role: "MANAGER" });
    const res = await request(app).post(`/api/v1/ai-suggestions/${suggestionId}/approve`).send();
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  it("should reject for authorized user", async () => {
    const rejectId = "suggestion-2";
    const app = createTestApp({ id: "admin-1", role: "MANAGER" });
    const res = await request(app)
      .post(`/api/v1/ai-suggestions/${rejectId}/reject`)
      .send({ reason: "not valid" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("rejected");
  });
});
