# AI-Brain Insights Report

## Overview
- Implemented the AI insights submodule with DTOs, pagination, brand-scoped filtering, and insight creation through the core AI client/orchestrator so the feature now mirrors the backend patterns used by Inventory, Support, Operations, and White Label.
- Added `/ai-brain/insights` GET/POST endpoints wired through Zod validation, the controller, and the service, keeping the controller lean (no business logic) and the service responsible for Prisma persistence.

## Endpoints implemented
- `GET /ai-brain/insights`: lists insights filtered by brand/os/entity/search with pagination (`listInsightsSchema` + `listInsights` service).
- `POST /ai-brain/insights`: stores an insight, calling `runAIRequest` to auto-generate summary/details when inputs are absent and returning the mapped DTO.

## DTO & validation summary
- `AIInsightDTO` surfaces the insight metadata and timestamps; `InsightListParams`/`InsightListResponse` describe the paged list contract; `CreateInsightInput` captures optional OS/entity context alongside summary/details.  
- Validation happens in `ai-brain.validators.ts` (brandId required, pagination defaults, etc.), and controllers rely on these sanitized payloads.

## Prisma & orchestrator notes
- All selects use the `AIInsight` model (`prisma/schema.prisma:2331-2343`), so every returned field maps directly to a column.  
- `listInsights` groups by brand, os, and entity filters before counting/paginating, while `createInsight` writes summary/details into the same table.  
- `runAIRequest` (core AI client) is invoked when both summary + details are missing; the generated text seeds both fields and ensures orchestrator integration from day one.

## Running the Thunder Client collection
1. Populate `ai-brain.http` variables (`@bearerToken`, `@brandId`, `@entityId`).  
2. Run the requests sequentially: list → manual create → generated create.  
3. Confirm responses include insight IDs, summary/details, and that pagination honors `page`/`pageSize`.

## Future expansions
- Add Insight reports/learning logs (Step B) on top of this foundation plus AI-driven notifications or automations derived from new insights.  
- Introduce entity-specific metadata (pricing, CRM, marketing, finance) by extending DTOs and storing structured `details` JSON.
