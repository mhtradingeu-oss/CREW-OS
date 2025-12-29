import type { Request, Response, NextFunction } from "express";
import { requireParam } from "../../core/http/params.js";
import { generateKnowledgeSummary } from "./knowledge-base.ai.js";
import { knowledgeBaseService } from "./knowledge-base.service.js";
import {
  createKnowledgeDocumentSchema,
  listKnowledgeDocumentsSchema,
  updateKnowledgeDocumentSchema,
  knowledgeBaseSummarySchema,
  knowledgeBaseAttachSchema,
  knowledgeBaseQaSchema,
} from "./knowledge-base.validators.js";
import { respondWithSuccess } from "../../core/http/respond.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { runAIPipeline } from "../../core/ai/pipeline/pipeline-runner.js";
import { prisma } from "../../core/prisma.js";
import { safeTruncate } from "../../core/ai/pipeline/pipeline-utils.js";
import { getUserPermissions, type AuthenticatedRequest } from "../../core/security/rbac.js";

function resolveBrandId(source: unknown): string | undefined {
  if (typeof source === "string" && source.trim()) {
    return source;
  }
  return undefined;
}


// List documents: { items, total, page, pageSize }
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = listKnowledgeDocumentsSchema.parse(req.query);
    const data = await knowledgeBaseService.listDocuments(payload);
    respondWithSuccess(res, data);
  } catch (err) {
    next(err);
  }
}


// Get single document by id (KnowledgeDocumentDTO)
export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    // brandId is not required for service, only id
    const item = await knowledgeBaseService.getDocument(id);
    if (!item) {
      return next(notFound("Knowledge document not found"));
    }
    respondWithSuccess(res, item);
  } catch (err) {
    next(err);
  }
}


// Create document (KnowledgeDocumentDTO)
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = createKnowledgeDocumentSchema.parse(req.body);
    const document = await knowledgeBaseService.createDocument(payload);
    respondWithSuccess(res, document, 201);
  } catch (err) {
    next(err);
  }
}


// Update document (KnowledgeDocumentDTO)
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = updateKnowledgeDocumentSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const document = await knowledgeBaseService.updateDocument(id, payload);
    respondWithSuccess(res, document);
  } catch (err) {
    next(err);
  }
}


// Delete document (id only)
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = requireParam(req.params.id, "id");
    await knowledgeBaseService.deleteDocument(id);
    respondWithSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
}

export async function aiSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = knowledgeBaseSummarySchema.parse(req.body);
    const documentId = requireParam(req.params.id, "id");
    const summary = await generateKnowledgeSummary({
      brandId: payload.brandId,
      documentId,
    });
    respondWithSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}


// Attach file to document (KnowledgeDocumentDTO)
export async function attachFile(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = knowledgeBaseAttachSchema.parse(req.body);
    const id = requireParam(req.params.id, "id");
    const document = await knowledgeBaseService.attachFile(id, payload.fileUrl, payload.storageKey);
    respondWithSuccess(res, document);
  } catch (err) {
    next(err);
  }
}

export async function aiQa(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const payload = knowledgeBaseQaSchema.parse(req.body);
    const documentId = requireParam(req.params.id, "id");
    const brandId = payload.brandId;

    const permissions = req.user?.id ? await getUserPermissions(req.user.id) : [];
    const actorPermissions = Array.from(new Set([...permissions, "ai:context:kb"]));

    const pipeline = await runAIPipeline({
      agentId: "KNOWLEDGE_QA",
      task: {
        prompt: payload.question,
        input: {
          documentId,
          brandId,
          question: payload.question,
          action: "advisor-insight",
        },
      },
      actor: {
        userId: req.user?.id,
        role: req.user?.role,
        permissions: actorPermissions,
        brandId,
        tenantId: req.user?.tenantId,
      },
      brandId,
      tenantId: req.user?.tenantId ?? undefined,
    });

    if (!pipeline.success) {
      return next(badRequest("AI pipeline failed", { status: pipeline.status, errors: pipeline.errors }));
    }

    const summary = typeof pipeline.output === "object" && pipeline.output && "summary" in (pipeline.output as Record<string, unknown>)
      ? String((pipeline.output as Record<string, unknown>).summary ?? "Knowledge QA" )
      : "Knowledge QA";

    const insight = await prisma.aIInsight.create({
      data: {
        brandId,
        os: "knowledge",
        entityType: "AI_RECOMMENDATION",
        entityId: documentId,
        summary,
        details: safeTruncate({ output: pipeline.output, runId: pipeline.runId }, 4000),
      },
    });

    respondWithSuccess(res, {
      output: pipeline.output,
      runId: pipeline.runId,
      autonomy: pipeline.autonomyDecision,
      insightId: insight.id,
      status: pipeline.status ?? (pipeline.autonomyDecision?.requireApproval ? "pending_approval" : "ok"),
    });
  } catch (err) {
    next(err);
  }
}
