import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { requireParam } from "../../core/http/params.js";
import { supportService } from "./support.service.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import {
  closeTicketSchema,
  addTicketMessageSchema,
  assignTicketSchema,
  createTicketSchema,
  updateTicketStatusSchema,
  startVoiceSessionSchema,
  voiceTurnSchema,
  endVoiceSessionSchema,
  supportTriageSchema,
} from "./support.validators.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { getUserPermissions, type AuthenticatedRequest } from "../../core/security/rbac.js";

const listQuerySchema = z.object({
  brandId: z.string().min(1),
  status: z.string().optional(),
  assigneeId: z.string().optional(),
  channel: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const conversationListSchema = z.object({
  brandId: z.string().min(1),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const brandQuerySchema = z.object({
  brandId: z.string().min(1),
});

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const params = listQuerySchema.parse(req.query);
    const payload = await supportService.listTickets(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = brandQuerySchema.parse(req.query);
    const id = requireParam(req.params.id, "id");
    const item = await supportService.getTicketWithMessages(id, brandId);
    if (!item) {
      return next(notFound("Ticket not found"));
    }
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createTicketSchema.parse(req.body);
    const item = await supportService.createTicket(payload);
    respondWithSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
}

export async function addMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = addTicketMessageSchema.parse(req.body);
    const payload = {
      ticketId: requireParam(req.params.id, "id"),
      senderId: parsed.senderId,
      content: parsed.content,
      locale: parsed.locale,
    };
    const message = await supportService.addMessage(payload);
    respondWithSuccess(res, message, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = updateTicketStatusSchema.parse(req.body);
    const payload = {
      ticketId: requireParam(req.params.id, "id"),
      brandId: parsed.brandId,
      status: parsed.status,
      closedAt: parsed.closedAt,
    };
    const ticket = await supportService.updateTicketStatus(payload);
    respondWithSuccess(res, ticket);
  } catch (err) {
    next(err);
  }
}

export async function assignTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = assignTicketSchema.parse(req.body);
    const payload = {
      ticketId: requireParam(req.params.id, "id"),
      assigneeUserId: parsed.assigneeUserId,
      brandAssignmentScope: parsed.brandAssignmentScope,
      role: parsed.role,
    };
    const assignment = await supportService.assignTicket(payload);
    respondWithSuccess(res, assignment, 201);
  } catch (err) {
    next(err);
  }
}

export async function closeTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = closeTicketSchema.parse(req.body);
    const payload = {
      ticketId: requireParam(req.params.id, "id"),
      brandId: parsed.brandId,
      status: parsed.status,
      closedAt: parsed.closedAt,
    };
    const ticket = await supportService.closeTicket(payload);
    respondWithSuccess(res, ticket);
  } catch (err) {
    next(err);
  }
}

export async function triageTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = supportTriageSchema.parse(req.body ?? {});
    const ticketId = parsed.ticketId ?? requireParam(req.params.id, "id");
    const authReq = req as AuthenticatedRequest;
    const permissions = authReq.user?.id ? await getUserPermissions(authReq.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:support"]));
    const brandId = parsed.brandId ?? authReq.user?.brandId ?? undefined;

    const pipeline = await runAIPipeline({
      agentId: "SUPPORT_TRIAGE",
      task: {
        prompt: parsed.goal ?? "Summarize ticket and draft safe reply",
        input: {
          ticketId,
          brandId,
          action: "draft-support-reply",
        },
      },
      actor: {
        userId: authReq.user?.id,
        role: authReq.user?.role,
        permissions: actorPermissions,
        brandId,
        tenantId: authReq.user?.tenantId,
      },
      brandId: brandId ?? undefined,
      tenantId: authReq.user?.tenantId ?? undefined,
    });

    if (!pipeline.success) {
      return next(badRequest("AI pipeline failed", { status: pipeline.status, errors: pipeline.errors }));
    }

    respondWithSuccess(res, {
      output: pipeline.output,
      status: pipeline.status ?? (pipeline.autonomyDecision?.requireApproval ? "pending_approval" : "ok"),
      autonomy: pipeline.autonomyDecision,
      runId: pipeline.runId,
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = brandQuerySchema.parse(req.query);
    const id = requireParam(req.params.id, "id");
    const convo = await supportService.getConversationById(id, brandId);
    if (!convo) return next(notFound("Conversation not found"));
    respondWithSuccess(res, convo);
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req: Request, res: Response, next: NextFunction) {
  try {
    const params = conversationListSchema.parse(req.query);
    const payload = await supportService.listConversations(params);
    respondWithSuccess(res, payload);
  } catch (err) {
    next(err);
  }
}

export async function listMessages(req: Request, res: Response, next: NextFunction) {
  try {
    const { brandId } = brandQuerySchema.parse(req.query);
    const ticketId = requireParam(req.params.id, "id");
    const messages = await supportService.listTicketMessages(ticketId, brandId);
    respondWithSuccess(res, messages);
  } catch (err) {
    next(err);
  }
}

export async function startVoiceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = startVoiceSessionSchema.parse(req.body);
    const session = await supportService.startVoiceSession(payload);
    respondWithSuccess(res, session, 201);
  } catch (err) {
    next(err);
  }
}

export async function processVoiceTurn(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = voiceTurnSchema.parse(req.body);
    const sessionId = requireParam(req.params.id, "id");
    const result = await supportService.processVoiceTurn({ sessionId, ...payload });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function endVoiceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = endVoiceSessionSchema.parse(req.body);
    const sessionId = requireParam(req.params.id, "id");
    const result = await supportService.completeVoiceSession({ sessionId, ...payload });
    respondWithSuccess(res, result);
  } catch (err) {
    next(err);
  }
}

export async function getVoiceSession(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = requireParam(req.params.id, "id");
    const session = await supportService.getVoiceSession(sessionId);
    if (!session) return next(notFound("Voice session not found"));
    respondWithSuccess(res, session);
  } catch (err) {
    next(err);
  }
}

export async function getChannelConfig(_req: Request, res: Response, next: NextFunction) {
  try {
    respondWithSuccess(res, {
      channels: [
        { id: "web", label: "Web Chat", enabled: true },
        { id: "email", label: "Email", enabled: true },
        { id: "whatsapp", label: "WhatsApp / SMS", enabled: true },
        { id: "voice", label: "Voice / IVR", enabled: true, supportsVoice: true },
        { id: "internal", label: "Internal Note", enabled: true },
      ],
      locales: ["en", "de", "ar"],
      defaultLocale: "en",
    });
  } catch (err) {
    next(err);
  }
}
