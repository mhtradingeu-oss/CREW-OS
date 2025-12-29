
import { canPerform } from "../can-perform.js";
import { ActionMetadata } from "../../actions/metadata.js";

const defaultFlags = {
  AI_AUTONOMY_ENABLED: true,
  AI_MAX_RISK: "CRITICAL",
  AI_KILL_SWITCH: false,
};

const baseMetadata = {
  risk: "LOW",
  sideEffect: "NONE",
  description: "unit test action",
};

const buildMetadata = (overrides = {}) => ({
  ...baseMetadata,
  ...overrides,
});

describe("policy canPerform", () => {

  it("denies everything when the global kill switch is active (explain object)", () => {
    const decision = canPerform({
      actionId: "INTERNAL_LOG",
      metadata: buildMetadata(),
      environment: "production",
      flags: {
        ...defaultFlags,
        AI_KILL_SWITCH: true,
      },
      correlationId: "cid-1"
    });

    expect(decision.type).toBe("DENY");
    expect(decision.reason).toBe("Global AI kill switch enabled");
    expect(decision.correlationId).toBe("cid-1");
    expect(decision.explain).toBeDefined();
    expect(decision.explain.summary).toContain("kill switch");
    expect(decision.explain.decisionPath).toContain("Checked global kill switch");
  });


  it("denies high-risk actions that exceed the configured maximum (explain object)", () => {
    const decision = canPerform({
      actionId: "INTERNAL_LOG",
      metadata: buildMetadata({ risk: "HIGH" }),
      environment: "production",
      flags: {
        ...defaultFlags,
        AI_MAX_RISK: "MEDIUM",
      },
      correlationId: "cid-2"
    });

    expect(decision.type).toBe("DENY");
    expect(decision.reason).toBe("Action risk exceeds configured maximum");
    expect(decision.correlationId).toBe("cid-2");
    expect(decision.explain).toBeDefined();
    expect(decision.explain.summary).toContain("risk exceeds");
    expect(decision.explain.decisionPath).toContain("Checked risk ceiling");
  });


  it("requires approval in production when no approval was granted (explain object)", () => {
    const decision = canPerform({
      actionId: "INTERNAL_LOG",
      metadata: buildMetadata({ approvalHints: { requiresApprovalInProd: true } }),
      environment: "production",
      flags: defaultFlags,
      correlationId: "cid-3"
    });

    expect(decision.type).toBe("REQUIRE_APPROVAL");
    expect(decision.reason).toBe("Action requires approval in production");
    expect(decision.correlationId).toBe("cid-3");
    expect(decision.explain).toBeDefined();
    expect(decision.explain.summary).toContain("approval in production");
    expect(decision.explain.decisionPath).toContain("Checked production approval");
  });

  it("allows production execution when approval is already granted", () => {
    const decision = canPerform({
      actionId: "INTERNAL_LOG",
      metadata: buildMetadata({ approvalHints: { requiresApprovalInProd: true } }),
      environment: "production",
      approvals: { approved: true },
      flags: defaultFlags,
    });

    expect(decision).toEqual({ type: "ALLOW" });
  });

  it("allows low-risk development actions when nothing blocks them", () => {
    const decision = canPerform({
      actionId: "INTERNAL_LOG",
      metadata: buildMetadata({ risk: "LOW" }),
      environment: "development",
      flags: defaultFlags,
    });

    expect(decision).toEqual({ type: "ALLOW" });
  });
});
