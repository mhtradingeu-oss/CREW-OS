import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(20);

const toTagIds = z.preprocess((value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : String(item))).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return undefined;
}, z.array(z.string().min(1)).optional());

const knowledgeDocumentBase = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  sourceType: z.string().optional(),
  language: z.string().optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  campaignId: z.string().optional(),
  fileUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
});

export const listKnowledgeDocumentsSchema = z.object({
  brandId: z.string().min(1),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
  campaignId: z.string().optional(),
  tag: z.string().optional(),
  sourceType: z.string().optional(),
  tagIds: toTagIds,
  page: pageSchema,
  pageSize: pageSizeSchema,
});

export const createKnowledgeDocumentSchema = knowledgeDocumentBase.extend({
  brandId: z.string().min(1),
});

export const updateKnowledgeDocumentSchema = knowledgeDocumentBase
  .partial()
  .extend({ brandId: z.string().min(1) });

export const knowledgeBaseSummarySchema = z.object({
  brandId: z.string().min(1),
});

export const knowledgeBaseAttachSchema = z.object({
  brandId: z.string().min(1),
  fileUrl: z.string().url().optional(),
  storageKey: z.string().optional(),
});

export const knowledgeBaseQaSchema = z.object({
  brandId: z.string().min(1),
  question: z.string().min(3).max(800),
});
