import { Router } from "express";
import * as controller from "./support.controller.js";
import { requirePermission } from "../../core/security/rbac.js";
import { validateBody } from "../../core/http/middleware/validate.js";
import { requireFeature } from "../../core/http/middleware/plan-gating.js";
import {
  createTicketSchema,
  addTicketMessageSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
  closeTicketSchema,
  startVoiceSessionSchema,
  voiceTurnSchema,
  endVoiceSessionSchema,
  supportTriageSchema,
} from "./support.validators.js";

const router = Router();

router.get("/tickets", requirePermission("support:read"), controller.list);
router.post(
  "/tickets",
  requirePermission(["support:update", "support:create"]),
  validateBody(createTicketSchema),
  controller.create,
);
router.get("/tickets/:id", requirePermission("support:read"), controller.getById);
router.patch(
  "/tickets/:id",
  requirePermission("support:update"),
  validateBody(updateTicketStatusSchema),
  controller.updateStatus,
);
router.put(
  "/tickets/:id",
  requirePermission("support:update"),
  validateBody(updateTicketStatusSchema),
  controller.updateStatus,
);
router.post(
  "/tickets/:id/reply",
  requirePermission("support:update"),
  validateBody(addTicketMessageSchema),
  controller.addMessage,
);
router.post(
  "/tickets/:id/messages",
  requirePermission("support:update"),
  validateBody(addTicketMessageSchema),
  controller.addMessage,
);
router.post(
  "/tickets/:id/ai/triage",
  requirePermission(["support:read", "support:update"]),
  requireFeature("operations"),
  validateBody(supportTriageSchema),
  controller.triageTicket,
);
router.get(
  "/tickets/:id/messages",
  requirePermission("support:read"),
  controller.listMessages,
);
router.post(
  "/tickets/:id/assign",
  requirePermission("support:assign"),
  validateBody(assignTicketSchema),
  controller.assignTicket,
);
router.post(
  "/tickets/:id/close",
  requirePermission("support:update"),
  validateBody(closeTicketSchema),
  controller.closeTicket,
);
router.get(
  "/conversations",
  requirePermission("support:read"),
  controller.listConversations,
);
router.get(
  "/conversations/:id",
  requirePermission("support:read"),
  controller.getConversation,
);
router.get(
  "/channels/config",
  requirePermission("support:read"),
  controller.getChannelConfig,
);

router.post(
  "/voice/sessions",
  requirePermission(["support:update", "support:create"]),
  requireFeature("voiceIVR"),
  validateBody(startVoiceSessionSchema),
  controller.startVoiceSession,
);
router.get(
  "/voice/sessions/:id",
  requirePermission("support:read"),
  requireFeature("voiceIVR"),
  controller.getVoiceSession,
);
router.post(
  "/voice/sessions/:id/turn",
  requirePermission("support:update"),
  requireFeature("voiceIVR"),
  validateBody(voiceTurnSchema),
  controller.processVoiceTurn,
);
router.post(
  "/voice/sessions/:id/end",
  requirePermission("support:update"),
  requireFeature("voiceIVR"),
  validateBody(endVoiceSessionSchema),
  controller.endVoiceSession,
);

// Legacy routes for backward compatibility
router.get("/", requirePermission("support:read"), controller.list);
router.get("/:id", requirePermission("support:read"), controller.getById);
router.post(
  "/",
  requirePermission(["support:update", "support:create"]),
  validateBody(createTicketSchema),
  controller.create,
);
router.post(
  "/:id/messages",
  requirePermission("support:update"),
  validateBody(addTicketMessageSchema),
  controller.addMessage,
);
router.patch(
  "/:id/status",
  requirePermission("support:update"),
  validateBody(updateTicketStatusSchema),
  controller.updateStatus,
);
router.post(
  "/:id/assign",
  requirePermission("support:assign"),
  validateBody(assignTicketSchema),
  controller.assignTicket,
);

export { router };
