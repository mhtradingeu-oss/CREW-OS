// ...existing code...
import type { Prisma } from "@prisma/client";
import {
  findKnowledgeCategory,
  findBrandProduct,
  findCampaign,
  listKnowledgeDocumentsWithCount,
  findKnowledgeDocument,
  createKnowledgeDocument,
  updateKnowledgeDocument,
  transactionalUpdateDocumentAndTags,
  transactionalDeleteDocumentAndTags
} from "../../core/db/repositories/knowledge-base.repository.js";
import { buildPagination } from "../../core/utils/pagination.js";
import { badRequest, notFound } from "../../core/http/errors.js";
import { logger } from "../../core/logger.js";
import type {
  CreateKnowledgeDocumentInput,
  KnowledgeDocumentDTO,
  KnowledgeTagDTO,
  KnowledgeCategoryDTO,
  ListKnowledgeDocumentsParams,
  PaginatedKnowledgeDocuments,
  UpdateKnowledgeDocumentInput,
} from "./knowledge-base.types.js";

const documentSelect = {
  id: true,
  brandId: true,
  title: true,
  content: true,
  summary: true,
  sourceType: true,
  language: true,
  product: { select: { id: true, name: true, brandId: true } },
  campaign: { select: { id: true, name: true, brandId: true } },
  fileUrl: true,
  storageKey: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  tags: {
    select: {
      id: true,
      name: true,
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.KnowledgeDocumentSelect;

function toCategoryDTO(record: Prisma.KnowledgeCategoryGetPayload<{ select: typeof documentSelect["category"]["select"] }>): KnowledgeCategoryDTO | undefined {
  if (!record) return undefined;
  return {
    id: record.id,
    name: record.name,
  };
}

function toTagDTO(record: Prisma.KnowledgeTagGetPayload<{ select: typeof documentSelect["tags"]["select"] }>): KnowledgeTagDTO {
  return {
    id: record.id,
    name: record.name,
  };
}

function toDocumentDTO(record: Prisma.KnowledgeDocumentGetPayload<{ select: typeof documentSelect }>): KnowledgeDocumentDTO {
  return {
    id: record.id,
    brandId: record.brandId ?? undefined,
    title: record.title,
    content: record.content ?? undefined,
    summary: record.summary ?? null,
    sourceType: record.sourceType ?? undefined,
    language: record.language ?? undefined,
    productId: record.product?.id ?? null,
    campaignId: record.campaign?.id ?? null,
    product: record.product ? { id: record.product.id, name: record.product.name } : undefined,
    campaign: record.campaign ? { id: record.campaign.id, name: record.campaign.name } : undefined,
    fileUrl: record.fileUrl ?? null,
    storageKey: record.storageKey ?? null,
    category: record.category ? toCategoryDTO(record.category) : undefined,
    tags: (record.tags ?? []).map(toTagDTO),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function ensureCategoryIsValid(categoryId: string, brandId: string) {
  const category = await findKnowledgeCategory({ id: categoryId });
  if (!category) {
    throw notFound("Knowledge category not found");
  }
  if (category.brandId && category.brandId !== brandId) {
    throw badRequest("Category belongs to a different brand");
  }
}

async function ensureProductMatchesBrand(productId: string, brandId: string) {
  const product = await findBrandProduct({ id: productId });
  if (!product) {
    throw notFound("Product not found");
  }
  if (product.brandId && product.brandId !== brandId) {
    throw badRequest("Product belongs to a different brand");
  }
}

async function ensureCampaignMatchesBrand(campaignId: string, brandId: string) {
  const campaign = await findCampaign({ id: campaignId });
  if (!campaign) {
    throw notFound("Campaign not found");
  }
  if (campaign.brandId && campaign.brandId !== brandId) {
    throw badRequest("Campaign belongs to a different brand");
  }
}

export const knowledgeBaseService = {
  async listDocuments(params: ListKnowledgeDocumentsParams): Promise<PaginatedKnowledgeDocuments> {
    if (!params.brandId) {
      throw badRequest("brandId is required");
    }

    const {
      brandId,
      search,
      categoryId,
      tagIds,
      sourceType,
      productId,
      campaignId,
      tag,
      page = 1,
      pageSize = 20,
    } = params;
    const { skip, take } = buildPagination({ page, pageSize });
    const where: Prisma.KnowledgeDocumentWhereInput = { brandId };

    if (categoryId) where.categoryId = categoryId;
    if (sourceType) where.sourceType = sourceType;
    if (productId) where.productId = productId;
    if (campaignId) where.campaignId = campaignId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }
    const tagConditions: Prisma.KnowledgeTagWhereInput[] = [];
    if (tagIds && tagIds.length) {
      tagConditions.push({ id: { in: tagIds } });
    }
    if (tag) {
      tagConditions.push({ name: { contains: tag, mode: "insensitive" } });
    }
    if (tagConditions.length) {
      where.tags = { some: { AND: tagConditions } };
    }

    const { total, rows } = await listKnowledgeDocumentsWithCount(where, { skip, take });
    return {
      items: rows.map(toDocumentDTO),
      total,
      page,
      pageSize: take,
    };
  },

  async getDocument(id: string): Promise<KnowledgeDocumentDTO | null> {
    const record = await findKnowledgeDocument({ id });
    if (!record) return null;
    return toDocumentDTO(record);
  },

  async createDocument(input: CreateKnowledgeDocumentInput): Promise<KnowledgeDocumentDTO> {
    if (input.categoryId) {
      await ensureCategoryIsValid(input.categoryId, input.brandId);
    }
    if (input.productId) {
      await ensureProductMatchesBrand(input.productId, input.brandId);
    }
    if (input.campaignId) {
      await ensureCampaignMatchesBrand(input.campaignId, input.brandId);
    }

    const data: Prisma.KnowledgeDocumentCreateInput = {
      brand: { connect: { id: input.brandId } },
      title: input.title,
      content: input.content ?? undefined,
      sourceType: input.sourceType ?? undefined,
      language: input.language ?? undefined,
      product: input.productId ? { connect: { id: input.productId } } : undefined,
      campaign: input.campaignId ? { connect: { id: input.campaignId } } : undefined,
      fileUrl: input.fileUrl ?? undefined,
      storageKey: input.storageKey ?? undefined,
      category: input.categoryId ? { connect: { id: input.categoryId } } : undefined,
      tags: input.tags?.length ? { create: input.tags.map((name) => ({ name })) } : undefined,
    };

    const created = await createKnowledgeDocument(data);
    
    logger.info(`[knowledge-base] Created document ${created.id} for brand ${input.brandId}`);
    return toDocumentDTO(created);
  },

  async updateDocument(id: string, input: UpdateKnowledgeDocumentInput): Promise<KnowledgeDocumentDTO> {
    const existing = await findKnowledgeDocument({ id });
    if (!existing || existing.brandId !== input.brandId) {
      throw notFound("Knowledge document not found");
    }

    if (input.categoryId) {
      await ensureCategoryIsValid(input.categoryId, input.brandId);
    }
    if (input.productId) {
      await ensureProductMatchesBrand(input.productId, input.brandId);
    }
    if (input.campaignId) {
      await ensureCampaignMatchesBrand(input.campaignId, input.brandId);
    }

    const data: Prisma.KnowledgeDocumentUpdateInput = {};
    if (Object.prototype.hasOwnProperty.call(input, "title") && typeof input.title === "string") {
      data.title = input.title;
    }
    if (Object.prototype.hasOwnProperty.call(input, "content")) {
      data.content = input.content ?? undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "sourceType")) {
      data.sourceType = input.sourceType ?? undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "language")) {
      data.language = input.language ?? undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "productId")) {
      if (input.productId) {
        data.product = { connect: { id: input.productId } };
      } else {
        data.product = { disconnect: true };
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, "campaignId")) {
      if (input.campaignId) {
        data.campaign = { connect: { id: input.campaignId } };
      } else {
        data.campaign = { disconnect: true };
      }
    }
    if (Object.prototype.hasOwnProperty.call(input, "fileUrl")) {
      data.fileUrl = input.fileUrl ?? undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "storageKey")) {
      data.storageKey = input.storageKey ?? undefined;
    }
    if (Object.prototype.hasOwnProperty.call(input, "categoryId")) {
      if (input.categoryId) {
        data.category = { connect: { id: input.categoryId } };
      } else {
        data.category = { disconnect: true };
      }
    }

    const tagsProvided = Object.prototype.hasOwnProperty.call(input, "tags");
    const tags = input.tags ?? [];

    let updated;
    if (tagsProvided) {
      updated = await transactionalUpdateDocumentAndTags(id, data, tags);
    } else {
      updated = await updateKnowledgeDocument(id, data);
    }

    logger.info(`[knowledge-base] Updated document ${id}`);
    return toDocumentDTO(updated);
  },

  async attachFile(id: string, fileUrl?: string | null, storageKey?: string | null) {
    const existing = await findKnowledgeDocument({ id });
    if (!existing) {
      throw notFound("Knowledge document not found");
    }

    const updated = await updateKnowledgeDocument(id, {
      fileUrl: fileUrl ?? undefined,
      storageKey: storageKey ?? undefined,
    });
    
    logger.info(`[knowledge-base] Attached file metadata to document ${id}`);
    return toDocumentDTO(updated);
  },

  async deleteDocument(id: string) {
    const existing = await findKnowledgeDocument({ id });
    if (!existing) {
      throw notFound("Knowledge document not found");
    }

    await transactionalDeleteDocumentAndTags(id);
    logger.info(`[knowledge-base] Deleted document ${id}`);
    return { id };
  },
};
