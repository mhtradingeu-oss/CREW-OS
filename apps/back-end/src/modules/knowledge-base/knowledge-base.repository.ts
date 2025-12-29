import { prisma } from "../../core/prisma.js";

type KnowledgeDocumentRecord = NonNullable<Awaited<ReturnType<typeof prisma.knowledgeDocument.findFirst>>>;

export type AIInsightSelect = Parameters<typeof prisma.aIInsight.create>[0]["select"];

export async function getDocumentById({
  brandId,
  documentId,
}: {
  brandId: string;
  documentId: string;
}) {
  return prisma.knowledgeDocument.findFirst({
    where: { id: documentId, brandId },
    include: {
      category: { select: { name: true } },
      tags: { select: { name: true }, orderBy: { createdAt: "asc" } },
      brand: { select: { name: true, slug: true } },
      product: { select: { id: true, name: true, brandId: true } },
      campaign: { select: { id: true, name: true, brandId: true } },
    },
  });
}

export async function createAIInsightWithJournalAndSummary({
  brandId,
  documentId,
  summary,
  details,
  insightSelect,
}: {
  brandId: string;
  documentId: string;
  summary: string;
  details: string;
  insightSelect: AIInsightSelect;
}) {
  // Fetch document with tags included
  const documentWithTags = await prisma.knowledgeDocument.findUnique({
    where: { id: documentId },
    include: { tags: { select: { name: true } } },
  });

  const [insight] = await prisma.$transaction([
    prisma.aIInsight.create({
      data: {
        brandId,
        os: "knowledge-base",
        entityType: "document",
        entityId: documentId,
        summary,
        details,
      },
      select: insightSelect,
    }),
    prisma.aILearningJournal.create({
      data: {
        brandId,
        source: "knowledge-base-summary",
        eventType: "summary",
        inputSnapshotJson: JSON.stringify({
          documentId,
          title: documentWithTags?.title,
          tags: documentWithTags?.tags?.map((tag) => tag.name) ?? [],
        }),
        outputSnapshotJson: JSON.stringify({ summary, details }),
      },
    }),
    prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: { summary },
    }),
  ]);

  return insight;
}

export async function searchDocumentsForAI() {
  // Implement search logic as needed for AI
  return [];
}

export async function listDocumentsForContext() {
  // Implement listing logic as needed for AI
  return [];
}
