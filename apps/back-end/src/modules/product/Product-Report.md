# Product Module Report

## Overview
- Documented CRUD operations for `BrandProduct` with pagination/search, slug/SKU uniqueness, and brand ownership checks (`product.service.ts`).
- Added `/product/:id/ai/insight` GET/POST endpoints that orchestrate AI insights, persist them as `AIInsight` records (os=`product`, entityType=`product`, entityId=productId), and surface the latest insight to clients.
- Captured Thunder Client scenarios in `product.http`, highlighting list/get/create/update/delete flows plus the insight generation/refresh plumbing.

## Models & DTO alignment
- `BrandProduct` (`prisma/schema.prisma:186-229`) stores the core product metadata; service mappings keep `brandId`, `slug`, `description`, `status`, and pricing relations aligned with the DTOs in `product.types.ts`.
- `ProductPricing` snapshots (`prisma/schema.prisma:244-280`) feed the pricing preview shown in the dashboard; front-end pricing API (`front-end/lib/api/pricing.ts`) uses `PricingDto` with explicit nullable numbers.
- `AIInsight` (`prisma/schema.prisma:2331-2343`) now stores every product insight generated via `productService.createInsight` or inferred by the controller; the new GET endpoint reuses this table to return the most recent insight.
- `ProductInsightResponse` (`product.types.ts:68`) includes `summary`, `details`, and both `createdAt`/`updatedAt` so UI panels can show stale/freshness metadata.

## Insight pipeline
- `POST /product/:id/ai/insight` (`product.routes.ts:9`) validates `{ brandId, forceRegenerate? }`, ensures the product belongs to that brand, and builds a pricing-aware prompt (`buildProductInsightPrompt`) before running `orchestrateAI`.
- The orchestrator returns `{ summary, details }` (fallback if AI is offline); the service then writes an `AIInsight` row with `os="product"` and `entityType="product"`, plus the same summary/details, enabling MH-OS AI Brain dashboards to surface the insight alongside other OS contexts.
- `GET /product/:id/ai/insight` exposes the latest persisted insight (ordered by `updatedAt desc`) so the dashboard can render previously generated guidance without re-triggering the generator.
- `Product-Report` documents that these insights are naturally compatible with the AI Brain (`ai-brain/ai-insights.service.ts`) because every record has `brandId`, `os`, `entityType`, and `entityId`, making them queryable via `ai/insights?brandId=<>`.

## Gaps & next steps
- No API currently exposes `ProductPricing` trends beyond the latest snapshot; consider adding historical pricing insights or linking to AI learning journals once the insight UX matures.
- Insight generation reuses a single prompt template and lacks caching; review response caching (via `makeCacheKey`) or guardrails (rate limiting, error tracking) if usage spikes.
