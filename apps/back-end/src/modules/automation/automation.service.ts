
// Removed Prisma import; all db logic is in repository
import { z } from "zod";
import type { PolicyViolation, AutomationGateError } from "./automation.types.js";
import {
  createAutomationRuleVersion,
  findLatestAutomationRuleVersion,
  updateAutomationRuleVersion,
} from "../../core/db/repositories/automation.repository.js";

/**
 * Minimal shared types (keep your project's real types if already defined elsewhere)
 */
type RuleState = "DRAFT" | "REVIEW" | "ACTIVE" | "PAUSED" | "DISABLED";
type PolicyStatus = "ok" | "blocked" | "review_required";

type ConditionOp = "eq" | "neq" | "gt" | "lt" | "includes";
type ConditionConfig = { path: string; op: ConditionOp; value?: unknown };

type ActionType =
  | "notification"
  | "log"
  | "crm.createTask"
  | "inventory.createRefillRequest"
  | "pricing.flagDraftForApproval";

type ActionConfig = { type: ActionType; params?: Record<string, unknown> };
type ActionExecutionResult = { action: string; details?: Record<string, unknown> };

type EventContext = { brandId?: string; actorUserId?: string; module?: string; source?: string };
type EventEnvelope = { name: string; payload?: unknown; context?: Record<string, unknown> };

type AutomationRuleRecord = {
  id: string;
  brandId?: string;
};

type PricingActionContext = { brandId?: string; actorUserId?: string };



/**
 * Zod schemas for safe validation
 */
const actionSchema = z.object({
  type: z.enum([
    "notification",
    "log",
    "crm.createTask",
    "inventory.createRefillRequest",
    "pricing.flagDraftForApproval",
  ]),
  params: z.record(z.unknown()).optional(),
});

const actionsWrapperSchema = z.object({
  actions: z.array(actionSchema).min(1, "At least one action is required"),
});

const conditionSchema = z.object({
  path: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "lt", "includes"]),
  value: z.unknown().optional(),
});

const conditionsWrapperSchema = z
  .object({
    all: z.array(conditionSchema).optional(),
    any: z.array(conditionSchema).optional(),
  })
  .refine((v) => (v.all?.length ?? 0) + (v.any?.length ?? 0) > 0, {
    message: "At least one condition is required (all/any).",
  });



/**
 * ✅ Service class owns db + external dependencies
 * (wire your real deps here)
 */

export class AutomationService {
  constructor(
    private readonly deps: {
      notificationService: any;
      pricingService: any;
      publish: (...args: any[]) => Promise<void>;
      publishActivity: (...args: any[]) => Promise<void>;
      badRequest: (m: string) => Error;
      notFound: (m: string) => Error;
      ruleVersionSelect?: any;
      ruleSelect?: any;
      ruleVersionSelectUnsafe?: any;
    },
  ) {}

  // --- Controller-facing stub methods ---
  public async list(_args: any) {
    throw new Error('Not implemented: list');
  }

  public async getById(_id: string) {
    throw new Error('Not implemented: getById');
  }

  public async create(_data: any) {
    throw new Error('Not implemented: create');
  }

  public async update(_id: string, _data: any) {
    throw new Error('Not implemented: update');
  }

  public async remove(_id: string) {
    throw new Error('Not implemented: remove');
  }

  public async runScheduled(_date: Date) {
    throw new Error('Not implemented: runScheduled');
  }

  public async runRule(_id: string, _context: any) {
    throw new Error('Not implemented: runRule');
  }

  public async handleEvent(_event: any) {
    throw new Error('Not implemented: handleEvent');
  }

  // --- Formerly standalone: gateError ---
  private gateError(code: AutomationGateError["code"], message: string): AutomationGateError {
    return { code, message };
  }

  // --- Formerly AutomationGates.policyGatePreSave ---
  public policyGatePreSave(input: {
    ruleVersion: unknown;
    userRole?: string;
    permissions?: string[];
  }): PolicyViolation[] {
    // Phase 6: Only versioned rule fields are checked. Implement new logic as needed.
    return [];
  }

  // --- Formerly AutomationGates.activationGatePreActivate ---
  public activationGatePreActivate(input: {
    ruleVersion: unknown;
    policyStatus: PolicyStatus;
    permissions: string[];
  }): PolicyViolation[] {
    const { ruleVersion, policyStatus, permissions } = input;
    const violations: PolicyViolation[] = [];

    if (policyStatus === "blocked") {
      violations.push({
        code: "automation.policy.blocked",
        message: "Policy status is blocked. Activation denied."
      });
      return violations;
    }

    if (!permissions.includes("automation:rules:activate")) {
      violations.push({
        code: "automation.permission.missing",
        message: "Missing permission 'automation:rules:activate'."
      });
      return violations;
    }

    const versionSchema = z.object({
      state: z.enum(["DRAFT", "REVIEW", "ACTIVE", "PAUSED", "DISABLED"]),
      triggerEvent: z.string().optional(),
      actionsConfigJson: z.unknown().optional(),
      conditionConfigJson: z.unknown().optional(),
    });

    const parsed = versionSchema.safeParse(ruleVersion);
    if (!parsed.success) {
      violations.push({
        code: "automation.rule_version.invalid",
        message: parsed.error.issues.map((i) => i.message).join("; ")
      });
      return violations;
    }

    if (parsed.data.actionsConfigJson !== undefined) {
      const actionsOk = actionsWrapperSchema.safeParse(parsed.data.actionsConfigJson);
      if (!actionsOk.success) {
        violations.push({
          code: "automation.actions.invalid",
          message: actionsOk.error.issues.map((i) => i.message).join("; ")
        });
      }
    }

    if (parsed.data.conditionConfigJson !== undefined) {
      const condOk = conditionsWrapperSchema.safeParse(parsed.data.conditionConfigJson);
      if (!condOk.success) {
        violations.push({
          code: "automation.conditions.invalid",
          message: condOk.error.issues.map((i) => i.message).join("; ")
        });
      }
    }

    return violations;
  }

  // --- Formerly AutomationGates.toGateError ---
  public toGateError(violations: PolicyViolation[]): AutomationGateError | null {
    // If any violation exists, treat as error for gate error
    if (!violations.length) return null;
    return this.gateError(
      "AUTOMATION_GATE_BLOCKED",
      violations.map((v) => v.message).join(" | "),
    );
  }


  public async editRuleVersion(
    ruleId: string,
    input: {
      triggerEvent: string;
      conditionConfigJson: unknown;
      actionsConfigJson: unknown;
      metaSnapshotJson?: unknown;
      createdById?: string;
    },
  ) {
    const latest = await findLatestAutomationRuleVersion(ruleId, this.deps.ruleVersionSelect);

    if (!latest) throw this.deps.notFound("No version found for rule");

    if (["ACTIVE", "PAUSED"].includes(String(latest.state))) {
      return this.createRuleVersion({
        ruleId,
        triggerEvent: input.triggerEvent,
        conditionConfigJson: input.conditionConfigJson,
        actionsConfigJson: input.actionsConfigJson,
        metaSnapshotJson: input.metaSnapshotJson,
        createdById: input.createdById,
      });
    }

    return this.updateRuleVersion(latest.id, input);
  }


  private async createRuleVersion(data: any) {
    // All db logic is in repository
    return createAutomationRuleVersion(data);
  }

  private async updateRuleVersion(ruleVersionId: string, input: any) {
    // All db logic is in repository
    return updateAutomationRuleVersion(ruleVersionId, input);
  }

  // ------------------ Keep your existing methods below ------------------
  // recordRunDetails / evaluateConditions / runActions / createCrmTask / createRefillRequest / flagPricingDraft ...
  // Add new methods here as needed, but keep all logic inside this class.
}

// --- Singleton export (must be last) ---
// import { notificationService } from '../notification/notification.service.js';
// import { pricingService } from '../pricing/pricing.service.js';
import { publish } from '../../core/events/event-bus.js';
import { publishActivity } from '../../core/activity/activity.js';
import { badRequest, notFound } from '../../core/http/errors.js';

export const automationService = new AutomationService({
  notificationService: {}, // TODO: wire real service
  pricingService: {}, // TODO: wire real service
  publish,
  publishActivity,
  badRequest,
  notFound,
  ruleVersionSelect: {}, // TODO: fill with actual select shape
  ruleSelect: {}, // TODO: fill with actual select shape
});
