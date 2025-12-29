# Brand OS – System Manual (Draft)

## Overview
- Purpose: manage brands, identities, rules, AI configs; foundational for tenant governance and downstream domains (pricing, marketing, inventory, loyalty).
- Scope: CRUD for brands, identity, rules, AI config; plan/tenant scoping; AI insights generation.

## Data Models (Prisma)
- `Brand`: id, tenantId, name, slug, settingsJson, country/defaultCurrency, timestamps.
- `BrandIdentity`: 1:1 brand; tone/mission/vision/persona/story/keywords/colorPalette/socialProfilesJson.
- `BrandRules`: 1:1 brand; naming/description/marketing/discount/pricingConstraints/restrictedWords/allowedWords/aiRestrictions.
- `BrandAIConfig`: 1:1 brand; aiPersonality/tone/contentStyle/pricingStyle/enabledActionsJson/blockedTopicsJson/aiModelVersion.

## Backend APIs (current)
- `GET /api/v1/brand` (auth + plan context; `brand:read`)
- `GET /api/v1/brand/:id` (`brand:read`)
- `POST /api/v1/brand` (`brand:create` + feature `governance`)
- `PUT /api/v1/brand/:id` (`brand:update` + feature `governance`)
- `DELETE /api/v1/brand/:id` (`brand:delete` + feature `governance`)
- `GET /api/v1/brand/:id/identity` (`brand:read`)
- `PUT /api/v1/brand/:id/identity` (`brand:update` + feature `governance`)
- `POST /api/v1/brand/:id/ai/identity` (`brand:update` + `ai:manage` + feature `aiInsights`)
- `GET /api/v1/brand/:id/rules` (`brand:read`)
- `PUT /api/v1/brand/:id/rules` (`brand:update` + feature `governance`)
- `GET /api/v1/brand/:id/ai/config` (`brand:read` or `ai:manage`)
- `PUT /api/v1/brand/:id/ai/config` (`brand:update` + `ai:manage` + feature `aiInsights`)

All responses use `{ success: true, data }` via `respondWithSuccess`.

## Security & Access
- Auth required (`authenticateRequest` + RBAC `requirePermission`).
- Plan gating via `requireFeature`; brand creation/edit/delete gated by `governance`, AI endpoints by `aiInsights`.
- Tenant/brand scoping enforced in service with SUPER_ADMIN bypass; user linkage validated per tenant.
- Brand limits per plan (`PlanFeatureSet.brandLimit`).

## AI & Automation
- AI identity generation uses `orchestrateAI` with cache keys and deterministic fallback; AI execution logged (`AIExecutionLog`) with token/cost estimates and safety event (`AISafetyEvent`) of type `SAFETY_CONSTRAINT`.
- Domain events: `brand.created/updated/deleted`, `brand.identity.updated`, `brand.identity.ai_generated`, `brand.rules.updated`, `brand.ai_config.updated`.
- Activity logs recorded for create/update/delete, identity updates/AI runs, rules updates, and AI config updates (module `brand`).

## Frontend (status)
- Implemented: brand list with search/clear, brand detail workspace (basics, identity, rules, AI config), identity lab with AI refresh.
- Remaining: surface AI insights history + activity logs, add pagination/filtering on list, polish loading/error/empty states, and automated tests.

## Open Gaps / Next Steps
- Swap AI client to orchestrator + safety logging; cache/fallbacks.
- Add tests (service + routes) for scoping, plan gating, brand limits, identity/rules/ai-config flows.
- Add activity log/audit hooks and automation rule templates.
- Implement frontend pages and wire to real endpoints.
- Document migrations if schema changes; align with group manuals.
