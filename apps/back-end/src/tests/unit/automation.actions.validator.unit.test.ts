import { z } from "zod";

import {
  auditActionRunners,
  validateActionMetadataCompleteness,
  validateActionRegistryIntegrity,
} from "../../core/automation/actions/validation.js";
import type { ActionRunner } from "../../core/automation/actions/types.js";
import type { ActionMetadata } from "../../core/automation/actions/metadata.js";

const validRunner: ActionRunner<Record<string, unknown>> = {
  type: "INTERNAL_LOG",
  schema: z.object({}),
  metadata: {
    risk: "LOW",
    sideEffect: "REVERSIBLE",
    description: "Test runner that mirrors production logging behavior.",
    version: "0.1",
    approvalHints: { requiresApprovalInProd: false },
  },
  execute: async () => ({ data: {} }),
};

describe("Automation action metadata validator", () => {
  it("passes when metadata is complete", () => {
    const report = auditActionRunners([validRunner]);
    expect(report).toHaveLength(0);
  });

  it("reports schema issues when metadata is incomplete", () => {
    const invalidRunner: ActionRunner<Record<string, unknown>> = {
      ...validRunner,
      metadata: { risk: "LOW" } as unknown as ActionMetadata,
    };
    const report = auditActionRunners([invalidRunner]);
    expect(report).toHaveLength(1);
    const issue = report[0];
    if (!issue) {
      throw new Error("expected metadata issue");
    }
    expect(issue.errors.some((error) => error.includes("sideEffect"))).toBe(true);
    expect(issue.errors.some((error) => error.includes("description"))).toBe(true);
  });

  it("ensures the production registry passes the completeness check", () => {
    expect(() => validateActionMetadataCompleteness()).not.toThrow();
  });
});

describe("Automation action registry integrity validator", () => {
  it("passes when the live registry is healthy", () => {
    expect(() => validateActionRegistryIntegrity()).not.toThrow();
  });

  it("fails when metadata misses required props", () => {
    const badRunner: ActionRunner<Record<string, unknown>> = {
      ...validRunner,
      metadata: { risk: "LOW" } as unknown as ActionMetadata,
    };
    expect(() => validateActionRegistryIntegrity([badRunner])).toThrow(/description/);
  });

  it("fails when duplicate action types are present", () => {
    expect(() =>
      validateActionRegistryIntegrity([validRunner, { ...validRunner }]),
    ).toThrow(/duplicate action type/);
  });
});
