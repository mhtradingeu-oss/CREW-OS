# Brand OS — System Manual

## Overview (business + technical)
- Purpose: single source of truth for brand identity, guardrails, and AI persona across tenants; feeds Marketing, Pricing, CRM, Loyalty, and Automation OS.
- Scope: manages brand profile, identity narrative, operational rules, and AI configuration with tenant/brand scoping and plan gating (governance, aiInsights).
- Ownership: Brand OS service (`apps/back-end/src/modules/brand`) with React frontends under `apps/front-end/app/(dashboard)/dashboard/brands`.

## Data Models (Prisma)
- `Brand { id, name, slug, description?, countryOfOrigin?, defaultCurrency?, settingsJson, tenantId?, createdAt, updatedAt }` — anchor entity; scoped to tenant; holds arbitrary settings.
- `BrandIdentity { id, brandId!, vision?, mission?, values?, toneOfVoice?, persona?, brandStory?, keywords?, colorPalette?, packagingStyle?, socialProfilesJson?, timestamps }` — narrative + persona.
- `BrandRules { id, brandId!, namingRules?, descriptionRules?, marketingRules?, discountRules?, pricingConstraints?, restrictedWords?, allowedWords?, aiRestrictions?, timestamps }` — guardrails for naming/pricing/messaging/AI.
- `BrandAIConfig { id, brandId!, aiPersonality?, aiTone?, aiContentStyle?, aiPricingStyle?, aiEnabledActionsJson?, aiBlockedTopicsJson?, aiModelVersion?, timestamps }` — AI persona and safety surface.
- Relationships: `Brand` 1-1 to Identity/Rules/AIConfig, many to downstream modules (products, pricing, campaigns, etc.).

## Backend API (App Router Express)
- `GET /api/v1/brand` — list with search + pagination; RBAC `brand:read`.
- `GET /api/v1/brand/:id` — fetch by id; RBAC `brand:read`.
- `POST /api/v1/brand` — create; RBAC `brand:create`; plan `governance`; body `createBrandSchema`.
- `PUT /api/v1/brand/:id` — update; RBAC `brand:update`; plan `governance`; body `updateBrandSchema`.
- `DELETE /api/v1/brand/:id` — delete; RBAC `brand:delete`; plan `governance`.
- `GET /api/v1/brand/:id/identity` — fetch identity; RBAC `brand:read`.
- `PUT /api/v1/brand/:id/identity` — upsert identity; RBAC `brand:update`; plan `governance`.
- `POST /api/v1/brand/:id/ai/identity` — generate/refresh AI identity insight; RBAC `brand:update` + `ai:manage`; plan `aiInsights`.
- `GET /api/v1/brand/:id/rules` — fetch rules; RBAC `brand:read`.
- `PUT /api/v1/brand/:id/rules` — upsert rules; RBAC `brand:update`; plan `governance`.
- `GET /api/v1/brand/:id/ai/config` — fetch AI config; RBAC `brand:read` + `ai:manage`.
- `PUT /api/v1/brand/:id/ai/config` — upsert AI config; RBAC `brand:update` + `ai:manage`; plan `aiInsights`.
- Responses use `{ success: true, data }` envelope via `respondWithSuccess`.

## Frontend UX Map
- Overview/list: `dashboard/brands` page with search, table, delete, and create CTA (React Query + Axios client).
- Create form: `dashboard/brands/create` for basics (name, slug, description, country, currency).
- Detail: `dashboard/brands/[id]` with sections for basics, identity, rules, AI config, activity timeline, AI insights, and AI refresh control.
- Admin plane (read-only snapshot): `app/(app)/admin/brands` and superadmin view `app/superadmin/brands` for oversight.

## AI Integration
- AI orchestrator invoked via `brandService.refreshIdentityAi` using cache keys `brand:identity:ai` with deterministic fallback text.
- Token/cost estimation logged through `ai-monitoring`; safety events recorded via `recordSafetyEvent`.
- Frontend exposes "Refresh with AI" action on brand detail; insights rendered from AI Brain `/ai-insights` hook.

## Automation Integration
- Domain events emitted: `brand.created`, `brand.updated`, `brand.deleted`, `brand.identity.updated`, `brand.identity.ai_generated`, `brand.rules.updated`, `brand.ai_config.updated` via `brand.events.ts`.
- Event hub guards now validate payload presence; domain subscribers publish activity for Brand OS to Activity Log.
- Automation OS can subscribe to these events for workflows (notifications, onboarding, policy sync).

## Security & RBAC Matrix
- Permissions: `brand:read`, `brand:create`, `brand:update`, `brand:delete`, `ai:manage` (for AI endpoints).
- Plan gating: `requireFeature("governance")` for create/update/delete/identity/rules; `requireFeature("aiInsights")` for AI endpoints.
- Scoping: service enforces tenant/brand via context; SUPER_ADMIN bypass for cross-tenant ops; brand/user linkage validated per-tenant.

## Usage Workflows
- Create brand → optionally link users + settings → upsert identity → set rules → configure AI → refresh AI identity to seed insights → monitor activity and AI insights.
- Update guardrails (rules/AI config) triggers domain events and activity entries; automation can fan out notifications.
- Delete brand removes record and emits `brand.deleted`; downstream modules expected to enforce FK constraints.

## Future Enhancements
- Add packaging/compliance document models and endpoints; connect to Inventory/Stand logistics flows.
- Surface per-plan brand limits and upgrade prompts in UI; show feature lock banners.
- Add versioning/history for identity/rules; support draft/publish workflow.
- Expand AI prompts to include rules and current plan; add redaction for sensitive fields in logs.
