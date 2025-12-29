// Find document by id and brandId (for delete safety)
export async function findKnowledgeDocumentByIdAndBrand(id: string, brandId: string) {
  return prisma.knowledgeDocument.findFirst({ where: { id, brandId }, select: { id: true } });
}
import type { Prisma } from "@prisma/client";
import { prisma } from "../../prisma.js";

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
  category: { select: { id: true, name: true } },
  tags: { select: { id: true, name: true }, orderBy: { createdAt: "asc" } },
} satisfies Prisma.KnowledgeDocumentSelect;

export async function findKnowledgeCategory(where: Prisma.KnowledgeCategoryWhereUniqueInput) {
  return prisma.knowledgeCategory.findUnique({ where, select: { id: true, brandId: true } });
}

export async function findBrandProduct(where: Prisma.BrandProductWhereUniqueInput) {
  return prisma.brandProduct.findUnique({ where, select: { id: true, brandId: true } });
}

export async function findCampaign(where: Prisma.CampaignWhereUniqueInput) {
  return prisma.campaign.findUnique({ where, select: { id: true, brandId: true } });
}

export async function listKnowledgeDocumentsWithCount(where: Prisma.KnowledgeDocumentWhereInput, options: { skip?: number, take?: number } = {}) {
  const { skip, take } = options;
  const [total, rows] = await prisma.$transaction([
    prisma.knowledgeDocument.count({ where }),
    prisma.knowledgeDocument.findMany({ where, select: documentSelect, orderBy: { updatedAt: "desc" }, skip, take }),
  ]);
  return { total, rows };
}

export async function findKnowledgeDocument(where: Prisma.KnowledgeDocumentWhereInput) {
  return prisma.knowledgeDocument.findFirst({ where, select: documentSelect });
}

export async function createKnowledgeDocument(data: Prisma.KnowledgeDocumentCreateInput) {
  return prisma.knowledgeDocument.create({ data, select: documentSelect });
}

export async function updateKnowledgeDocument(id: string, data: Prisma.KnowledgeDocumentUpdateInput) {
  return prisma.knowledgeDocument.update({ where: { id }, data, select: documentSelect });
}

export async function transactionalUpdateDocumentAndTags(id: string, data: Prisma.KnowledgeDocumentUpdateInput, tags: string[]) {
  return prisma.$transaction(async (tx) => {
    await tx.knowledgeTag.deleteMany({ where: { documentId: id } });
    if (tags.length) {
      await tx.knowledgeTag.createMany({ data: tags.map((name) => ({ documentId: id, name })) });
    }
    return tx.knowledgeDocument.update({ where: { id }, data, select: documentSelect });
  });
}

export async function transactionalDeleteDocumentAndTags(id: string) {
  return prisma.$transaction([
    prisma.knowledgeTag.deleteMany({ where: { documentId: id } }),
    prisma.knowledgeDocument.delete({ where: { id } }),
  ]);
}
