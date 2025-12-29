# Brand Module Report

## Overview
- Added CRUD support for `Brand` records with pagination, search filters, slug uniqueness checks, and settings merging consistent with other OS modules (`brand.service.ts`).
- Extended the module to persist `BrandIdentity` rows, expose `/brand/:id/identity`, and provide an AI-powered refresh hook that persists outcomes in `AIInsight` (os=`brand`, entityType=`brand`).
- Documented the new flows, created a Thunder Client `brand.http` workspace, and aligned DTOs/validators with the Prisma schema.

## Prisma models in play
- `Brand` (`prisma/schema.prisma:92-165`): core record with settings JSON and relationships to identity, rules, and AI config plus downstream OS tables (products, pricing, CRM, etc.).
- `BrandIdentity` (`prisma/schema.prisma:167-196`): vision/mission/tone/keywords fields plus optional social profile JSON used by the new identity endpoints.
- `BrandRules` (`prisma/schema.prisma:198-216`): placeholder for brand-level guardrails (naming/marketing/AI) that currently lacks API coverage.
- `BrandAIConfig` (`prisma/schema.prisma:218-234`): stores persona/tone/config for AI agents; seeded but not surfaced via API yet (future gap to close).
- `AIInsight` (`prisma/schema.prisma:2331-2343`): captures summary/details for AI actions; the new identity endpoint now writes here for downstream analytics.

## Endpoints & DTOs
- `GET /brand` — paginated list with `search`, `page`, `pageSize` filters returning `BrandResponse`.
- `GET /brand/:id`, `POST /brand`, `PUT /brand/:id`, `DELETE /brand/:id` follow existing RBAC and Zod flows in `brand.controller.ts`.
- `GET /brand/:id/identity` returns `BrandIdentityResponse` (nullable until someone populates the row).
- `PUT /brand/:id/identity` accepts `vision`, `mission`, `toneOfVoice`, `keywords`, `socialProfiles`, etc. via `brandIdentitySchema` and persists via `brandService.upsertIdentity`.
- `POST /brand/:id/ai/identity` accepts `forceRegenerate` (optional) via `brandAiIdentitySchema`, calls `brandService.refreshIdentityAi`, and returns `BrandAiIdentityResponse` (`id`, `summary`, `details`, timestamps).
- DTOs (`brand.types.ts`) now include `BrandIdentityResponse`, `BrandIdentityInput`, and `BrandAiIdentityResponse` alongside the existing brand list/pagination shapes.

## AI strategy
- The identity refresh endpoint orchestrates a chat completion via `runAIRequest` (`gpt-4-turbo` default) with context lines for name, slug, description, vision, mission, tone, persona, and keywords.
- Prompt instructions require the assistant to emit a `Summary:` line followed by `Details:` guidance so the backend can reliably extract a concise summary and more elaborate details.
- Responses (success or fallback) are persisted into `AIInsight` with `os="brand"`, `entityType="brand"`, and `entityId` equal to the brand ID so downstream dashboards can consume them.
- Logging records each insight creation for auditability (`logger.info`).

## Gaps & next steps
- `BrandRules` and `BrandAIConfig` remain unmanaged by APIs; exposing their CRUD surfaces would let the UI enforce naming/marketing guardrails and AI personalization.
- Social profiles are stored as free-form JSON but there is no schema or UI to edit/view them; consider normalizing that data (e.g., array of platform/url pairs) before UX work.
- Identity AI currently uses a single summarizer prompt without caching or guardrails; add caching/ throttling plus better error propagation (e.g., store failure reason in `AIInsight`) before shipping to end users.
