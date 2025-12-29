export interface KnowledgeCategoryDTO {
  id: string;
  name: string;
}

export interface KnowledgeTagDTO {
  id: string;
  name: string;
}

export interface KnowledgeDocumentDTO {
  id: string;
  brandId?: string;
  title: string;
  content?: string;
  summary?: string | null;
  sourceType?: string;
  language?: string;
  productId?: string | null;
  campaignId?: string | null;
  fileUrl?: string | null;
  storageKey?: string | null;
  product?: { id: string; name: string };
  campaign?: { id: string; name: string };
  category?: KnowledgeCategoryDTO;
  tags: KnowledgeTagDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ListKnowledgeDocumentsParams {
  brandId: string;
  search?: string;
  categoryId?: string;
  tagIds?: string[];
  productId?: string;
  campaignId?: string;
  tag?: string;
  sourceType?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedKnowledgeDocuments {
  items: KnowledgeDocumentDTO[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateKnowledgeDocumentInput {
  brandId: string;
  title: string;
  content?: string;
  sourceType?: string;
  language?: string;
  categoryId?: string;
  tags?: string[];
  productId?: string;
  campaignId?: string;
  fileUrl?: string;
  storageKey?: string;
}

export interface UpdateKnowledgeDocumentInput {
  brandId: string;
  title?: string;
  content?: string;
  sourceType?: string;
  language?: string;
  categoryId?: string;
  tags?: string[];
  productId?: string | null;
  campaignId?: string | null;
  fileUrl?: string | null;
  storageKey?: string | null;
}

export interface KnowledgeSummaryDTO {
  insightId: string;
  summary?: string;
  details?: string;
}

export interface KnowledgeBaseEventPayload {
  brandId?: string;
  documentId?: string;
  action?: "created" | "updated" | "deleted" | string;
  metadata?: Record<string, unknown> | null;
  userId?: string;
}
