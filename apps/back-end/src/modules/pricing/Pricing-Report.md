# Pricing Module Report

## Overview
- Pricing CRUD touches `ProductPricing`, `ProductPriceDraft`, `CompetitorPrice`, and `AIPricingHistory`, covering list/get/create/update/delete plus audit trails (`pricing.service.ts`).
- Drafts gain an approval endpoint, competitor pricing flows remain intact, and a new AI suggestion route exposes `generateAISuggestion` with strategy hints to the dashboard.
- Thunder Client workspace (`pricing.http`) now documents lists, drafts, competitors, logs, and the AI suggestion endpoint so integration testing can validate pagination, draft approvals, and AI runs.

## Prisma/OpenAPI alignment
- `ProductPricing` (`prisma/schema.prisma:244-281`) stores decimals and shares brand/product relations; `PricingRecord` maps each `Decimal` through `decimalToNumber` so the frontend always sees `number | null`.
- `ProductPriceDraft` (`prisma/schema.prisma:336-352`) now supports approval via `/pricing/product/:productId/drafts/:draftId/approve`, which flips the `status` flag and records the `approvedById`.
- `CompetitorPrice` and `AIPricingHistory` remain consumers of the same price snapshots; logs still map decimals to numbers for display, ensuring no string-to-number surprises.
- DTOs (`pricing.types.ts`) define `PricingAISuggestion` with `currentNet` and optional `strategy`, letting dashboards compare old vs. new values plus risk/confidence metadata.

## Endpoints
- `GET /pricing` (brand/product filters, pagination) plus `/pricing/:id` follow RBAC with validation via `pricing.validators.ts`.
- `/pricing/product/:productId/drafts` (list/create) and `/pricing/product/:productId/drafts/:draftId/approve` allow draft lifecycle management before pricing publishes.
- `/pricing/product/:productId/competitors` (list/add) and `/pricing/product/:productId/logs` surface competitor feed and AI/history logs respectively.
- `POST /pricing/product/:productId/ai/suggest` (requires `ai:pricing` & `pricing:update`) accepts `{ strategy? }`, routes through `pricing.service.generateAISuggestion`, and returns the latest strategy, reasoning, risk level, and confidence score.

## AI pricing strategy
- `generateAISuggestion` builds a prompt via `pricingSuggestionPrompt` that now receives `strategyHint`, `currentNet`, and VAT; caching keys include `strategy` so each strategy produces discrete insights.
- The orchestrator returns `PricingAISuggestion` (with `strategy`, `currentNet`, `competitorSummary`, `confidenceScore`), with a fallback that echoes the current net value and a medium-risk tag when AI is unavailable.
- Dashboards can call the endpoint through React Query (`useAIPricingSuggestion`) and show the output alongside current pricing before updating `ProductPricing`.

## Gaps & next steps
- Draft approvals currently only flip status; consider wiring approvals to automatically apply the `newNet` to `ProductPricing` or emit `PricingLog` entries for compliance.
- Competitor logs are read-only; expose a dashboard to compare competitor deltas or trigger new AI runs when major shifts occur.
- Cache AI suggestions by strategy and product for faster refreshes and improved UX once usage increases.
