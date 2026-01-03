import { jest } from "@jest/globals";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { conflict, forbidden } from "../../../core/http/errors.js";
import type { AuthenticatedRequest } from "../../../core/http/http-types.js";
import type { ExecuteAiSuggestionRequest } from "../../ai-suggestions/ai-suggestion.execution.validators.js";
import type {
  ExecuteAutomationActionRequest,
  ExecuteAutomationActionResponse,
} from "../../automation/automation.execution.types.js";

const mockExecute = jest.fn() as jest.MockedFunction<
  (payload: ExecuteAutomationActionRequest, userId: string) => Promise<ExecuteAutomationActionResponse>
>;

const automationServiceModulePath = pathToFileURL(
  path.join(process.cwd(), "src/modules/automation/automation.execution.service"),
).href;

jest.unstable_mockModule(
  automationServiceModulePath,
  () => ({ automationExecutionService: { execute: mockExecute } }),
);
jest.unstable_mockModule("@paralleldrive/cuid2", () => ({
  createId: () => "mock-execution-id",
}));

let executeSuggestion: typeof import("../../ai-suggestions/ai-suggestion.controller.js").executeSuggestion;

beforeAll(async () => {
  const controller = await import("../../ai-suggestions/ai-suggestion.controller.js");
  executeSuggestion = controller.executeSuggestion;
});

const baseBody: ExecuteAiSuggestionRequest = {
  approvalDecisionId: "approval-1",
  snapshotHash: "snapshot-1",
  action: { type: "executeAiSuggestionPlan" },
  correlationId: "ctx-1",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockExecute.mockResolvedValue({
    executionId: "exec-1",
    approvalDecisionId: "approval-1",
    suggestionId: "suggestion-1",
    status: "SUCCESS",
    actionResult: { executed: true },
  });
});

function createRequest(overrides: Partial<AuthenticatedRequest & { context?: { correlationId?: string } }> = {}) {
  return {
    params: { id: "suggestion-1" },
    body: baseBody,
    user: { id: "user-1" },
    context: { correlationId: "ctx-1" },
    ...overrides,
  } as AuthenticatedRequest & { context?: { correlationId?: string } };
}

function createResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };
  return res;
}

describe("AI suggestion execute controller", () => {
  it("delegates to automation execution service and returns the payload", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await executeSuggestion(req, res, next);

    expect(mockExecute).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Automation execution is disabled",
      }),
    );
  });

  it("forwards kill-switch errors to next", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();
    const error = forbidden("blocked", undefined, "AUTOMATION_KILL_SWITCH");
    mockExecute.mockRejectedValueOnce(error);

    await executeSuggestion(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Automation execution is disabled",
      }),
    );
    expect(res.status).not.toHaveBeenCalled();
  });

  it("forwards snapshot mismatch errors to next", async () => {
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();
    const error = conflict("Snapshot mismatch", null, "SNAPSHOT_MISMATCH");
    mockExecute.mockRejectedValueOnce(error);

    await executeSuggestion(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Automation execution is disabled",
      }),
    );
    expect(res.status).not.toHaveBeenCalled();
  });
});
