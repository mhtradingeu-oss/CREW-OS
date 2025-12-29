import { Router } from "express";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requirePermission } from "../../core/security/rbac.js";
import {
  createBannedActionSchema,
  createFirewallRuleSchema,
  createSafetyConstraintSchema,
  oversightReviewSchema,
  redTeamSchema,
  testPromptSchema,
} from "./ai-safety.validators.js";
import {
  getBannedActions,
  getConstraints,
  getFirewallRules,
  postBannedAction,
  postConstraint,
  postFirewallRule,
  postOversight,
  postRedTeam,
  postTestPrompt,
} from "./ai-safety.controller.js";

const router = Router();

router.get("/firewall", requirePermission("ai:safety:read"), getFirewallRules);
router.get("/firewall-rules", requirePermission("ai:safety:read"), getFirewallRules);
router.post(
  "/firewall-rules",
  requirePermission("ai:safety:manage"),
  validateBody(createFirewallRuleSchema),
  postFirewallRule,
);

router.get("/safety-rules", requirePermission("ai:safety:read"), getConstraints);
router.get("/constraints", requirePermission("ai:safety:read"), getConstraints);
router.post(
  "/constraints",
  requirePermission("ai:safety:manage"),
  validateBody(createSafetyConstraintSchema),
  postConstraint,
);

router.get("/banned-actions", requirePermission("ai:safety:read"), getBannedActions);
router.post(
  "/banned-actions",
  requirePermission("ai:safety:manage"),
  validateBody(createBannedActionSchema),
  postBannedAction,
);

router.post(
  "/oversight",
  requirePermission("ai:safety:manage"),
  validateBody(oversightReviewSchema),
  postOversight,
);

router.post(
  "/red-team",
  requirePermission("ai:safety:manage"),
  validateBody(redTeamSchema),
  postRedTeam,
);

router.post(
  "/test-prompt",
  requirePermission("ai:safety:read"),
  validateBody(testPromptSchema),
  postTestPrompt,
);

export { router };
