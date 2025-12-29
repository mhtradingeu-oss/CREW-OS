# Marketing Module Report

## Overview
- Campaign CRUD now persists `Campaign` rows with objectives, budgets, channels, and statuses; list paginates and filters by brand/status (`marketing.service.ts:26-90`).
- Marketing AI endpoints wrap the orchestrator to generate full campaign copy (`/marketing/ai/generate`), SEO ideas (`/marketing/ai/seo`), and social captions (`/marketing/ai/captions`), with prompts centralized in `marketingPrompt`, `seoPrompt`, and `captionPrompt`.
- `marketing.http` documents each campaign endpoint plus the AI payloads so QA can exercise lists, CRUD, and AI scripts sequentially.

## Models/DTOs
- `CampaignRecord` (`marketing.types.ts`) exposes brand, channel, objective, status, and decimal budget (`budget` stored as `Decimal` but mapped to `Number` via `Number(row.budget)`).
- AI DTOs (`marketing.ai.types.ts`) include `MarketingGenerateInput|Result`, `MarketingSeoInput|Result`, and `MarketingCaptionsInput|Result`, ensuring clients know what fields to send (goal/tone/audience, topic/locale, topic/platform/tone).
- The `marketing.service` uses `campaignSelect` for pagination and ensures names are required before inserting while defaulting statuses to `draft`.

## AI pipeline
- `/marketing/ai/*` endpoints require `ai:marketing` + `marketing:update`, so campaigns remain scoped.
- Each AI helper builds a prompt via `marketing.ai.types`/`prompt-templates`, caches results (`makeCacheKey`), and falls back to sensible defaults when AI fails.
- Frontend hooks should call these endpoints via `marketing-ai.ts` (new client) so marketing operators can regenerate SEO copy, captions, or entire plans without leaving the dashboard.

## Testing notes
- `marketing.http` provides the sequence: list → create → update → delete, followed by the SEO/captions/plan payloads to verify the AI orchestrations.
- Ensure campaigns referencing different brands return filtered lists (by toggling `brandId` param) and that budgets survive the Decimal → Number mapping.
