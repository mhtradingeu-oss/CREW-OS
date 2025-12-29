# Knowledge Base OS

## Purpose
Houses training content, SOPs, product docs, regulatory assets, and embeds for AI consumption across marketing, CRM, support, and AI agents.

## Responsibilities
- Store `KnowledgeDocument`, `KnowledgeCategory`, `KnowledgeTag`, `KnowledgeSource` records, with content type (manual, PDF, system).
- Provide search and retrieval endpoints, support embedding pipelines (future), and feed AI agents with curated knowledge.
- Ensure each entry is audited via Activity Log to comply with governance.

## Inputs
- Uploaded documents (PDF, Word, links), AI-generated articles, regulatory files (CNPN, ISO), and developer guides.
- Tagging/metadata from operations/support teams.

## Outputs
- Knowledge search results, AI prompts (AI Content Factory, AI Brain), auto-reply templates for support, training guides for partners/stands.
- Activity log entries for transparency.

## Internal Components
- Models: `KnowledgeDocument`, `KnowledgeCategory`, `KnowledgeTag`, `KnowledgeSource`, `KnowledgeEmbedding` (future).
- Pipeline for ingestion/approval, versioning, category mapping, and role-based access via Security OS.

## Required API Endpoints
- `GET /api/v1/knowledge/list`, `POST /api/v1/knowledge/create`, `GET /api/v1/knowledge/categories`, `POST /api/v1/knowledge/tag`.

## Required Data Models
- `KnowledgeDocument`, `KnowledgeCategory`, `KnowledgeTag`, `KnowledgeSource`, `ActivityLog`, `AIInsight`.

## Integration Notes
- Feeds AI Brain, Content Factory, and Support OS with context for responses and agent prompts.
- Works with Security & Governance for access control and Platform Ops for document auditing.
