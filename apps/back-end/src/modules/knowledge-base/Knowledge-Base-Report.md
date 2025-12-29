# Knowledge Base Module Report

## Deliverables
- `knowledge-base.types.ts`: defines DTOs for documents, categories, tags, paginated lists, and summary payloads.
- `knowledge-base.validators.ts`: enforces brand-scoped listing, document creation/update payloads, and AI summary requests.
- `knowledge-base.service.ts`: Prisma-backed CRUD for `KnowledgeDocument` with category/tag hydration, scoped filtering, and transactional updates/deletes.
- `knowledge-base.controller.ts` & `knowledge-base.routes.ts`: wire the new endpoints (`GET /knowledge-base`, CRUD, `POST /knowledge-base/:id/ai/summary`) with RBAC/validation middleware.
- `knowledge-base.ai.ts`: calls `runAIRequest`, stores summaries in `AIInsight` + `AILearningJournal`, and returns a lightweight DTO.
- `knowledge-base.http`: Thunder Client collection covering list/create/read/update/delete plus AI summary execution.

## Models
- `KnowledgeDocument` (core document metadata and content).
- `KnowledgeCategory` (optional categorization per brand, validated for ownership).
- `KnowledgeTag` (per-document tags written as part of creation/update and used for filtering).
- `KnowledgeSource` (sourceType field is validated and surfaced in prompts; the dedicated source table is referenced in documentation for future enrichment).
- `AIInsight` & `AILearningJournal` (log the AI summary outputs for traceability).

## Endpoints
- `GET /knowledge-base?brandId&search?&categoryId?&tagIds?&sourceType?&page=&pageSize=` → paginated list (filters by title/content search, category, tag presence, and sourceType; always scoped to `brandId`).
- `GET /knowledge-base/:id?brandId=` → fetch one document with category + tag info.
- `POST /knowledge-base` → create document with optional tags, language, and source metadata (validates category ownership).
- `PUT /knowledge-base/:id` → update document fields; tags are replaced atomically when provided.
- `DELETE /knowledge-base/:id?brandId=` → removes document + related tag rows, brand-scoped.
- `POST /knowledge-base/:id/ai/summary` → fires knowledge-specific AI prompt, logs insight/learning, and returns the summary DTO.

## Filters & Pagination
- `ListKnowledgeDocumentsParams` enforces `brandId` plus optional `search`, `categoryId`, `sourceType`, and `tagIds` (comma-separated query or repeated `tagIds` entries are normalized by the validator).
- `buildPagination` provides consistent `page`/`pageSize`, defaulting to `1`/`20`, and the service returns the requested slice with `total` counts.
- Tag filtering uses `tags.some.id in tagIds`, so documents with any of the requested tags are returned while still enforcing the brand scope.

## AI summary behavior
- The summary helper loads the document, category, tags, and brand name to build a structured prompt that asks the AI to extract insights plus follow-up actions.
- Responses are written to `AIInsight` with `os="knowledge-base"`, `entityType="document"`, and `entityId=documentId`, while the raw prompt/result snapshot is stored in `AILearningJournal` for traceability.
- The returned DTO includes the `insightId`, the first line summary, and the full details text so callers can render concise and expanded views.

## Known limitations
- Tag creation is inline per document; there is no shared tag catalog or deduplication logic today.
- Source management relies on the `sourceType` string only. If future work requires explicit `KnowledgeSource` relations, the service should validate against existing `KnowledgeSource` entries.
- AI summary replays whatever the configured model returns; there is no guardrail enforcement beyond the prompt text, so clients should surface the generated summary and let users verify.
