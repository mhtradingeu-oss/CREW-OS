# Brand OS — Refined Manual (Block 1)

## What it does
- Single source of truth for brand profile, identity narrative, guardrails, and AI persona across tenants.
- Powers downstream modules: Pricing, Marketing, Inventory, CRM, Loyalty, Automation, AI Brain.

## Data model
- `Brand { id, name, slug, description?, countryOfOrigin?, defaultCurrency?, settingsJson, tenantId?, createdAt, updatedAt }`
- `BrandIdentity { brandId!, vision?, mission?, values?, toneOfVoice?, persona?, brandStory?, keywords?, colorPalette?, packagingStyle?, socialProfilesJson?, timestamps }`
- `BrandRules { brandId!, namingRules?, descriptionRules?, marketingRules?, discountRules?, pricingConstraints?, restrictedWords?, allowedWords?, aiRestrictions?, timestamps }`
- `BrandAIConfig { brandId!, aiPersonality?, aiTone?, aiContentStyle?, aiPricingStyle?, aiEnabledActionsJson?, aiBlockedTopicsJson?, aiModelVersion?, timestamps }`
- AI outputs stored in `AIInsight` with `os="brand"`, `entityType` in {`brand`, `brand_rules`}.

## API surface (backend)
- `GET /api/v1/brand` list (search, pagination) — `brand:read`
- `GET /api/v1/brand/:id` — `brand:read`
- `POST /api/v1/brand` — `brand:create`, feature `governance`
- `PUT /api/v1/brand/:id` — `brand:update`, feature `governance`
- `DELETE /api/v1/brand/:id` — `brand:delete`, feature `governance`
- `GET /api/v1/brand/:id/identity` — `brand:read`
- `PUT /api/v1/brand/:id/identity` — `brand:update`, feature `governance`
- `POST /api/v1/brand/:id/ai/identity` — `brand:update` + `ai:manage`, feature `aiInsights`
- `GET /api/v1/brand/:id/rules` — `brand:read`
- `PUT /api/v1/brand/:id/rules` — `brand:update`, feature `governance`
- `POST /api/v1/brand/:id/ai/rules` — `brand:update` + `ai:manage`, feature `aiInsights`
- `GET /api/v1/brand/:id/ai/config` — `brand:read` + `ai:manage`
- `PUT /api/v1/brand/:id/ai/config` — `brand:update` + `ai:manage`, feature `aiInsights`

## UI / UX map (frontend)
- `dashboard/brands` — list/search with delete and create CTA.
- `dashboard/brands/create` — basics form (name, slug, description, country, currency).
- `dashboard/brands/[id]` — sections: basics, identity (with AI Refresh), rules (with AI consistency check), AI config, activity timeline, AI insights panel.

## AI capabilities
- Identity enhancer: prompt now includes rules + AI config context; cache-keyed; deterministic fallback; safety and cost logged.
- Rules consistency check: new endpoint; compliance-style prompt; stores insight as `brand_rules`; safety + cost logged.
- AI events: `brand.identity.ai_generated`, `brand.rules.ai_generated` for automation/audit.

## Automation hooks
- Domain events: `brand.created|updated|deleted|identity.updated|identity.ai_generated|rules.updated|rules.ai_generated|ai_config.updated`.
- Activity subscriber records all brand events.
- Automation engine can subscribe to new AI rule check event for alerts/workflows.

## Security & governance
- RBAC: `brand:read|create|update|delete`, `ai:manage` for AI routes.
- Plan gating: `governance` for mutations, `aiInsights` for AI endpoints.
- Scoping: tenant/brand enforced in service; SUPER_ADMIN bypass; slug uniqueness enforced; brand limits via plan context.

## Edge cases / safeguards
- AI fallbacks return safe summaries when upstream fails.
- Restricted/allowed words and blocked topics included in prompts for safer output.
- Identity/rules upserts validate via Zod; socialProfiles JSON parsing with error surfacing in UI.

## Integration points
- Pricing/Product: brandId feeds pricing drafts and products; rules inform marketing copy.
- AI Brain: AIInsights accessible via `os=brand` or `brand_rules`.
- Automation: use brand events to trigger notifications, policy sync, onboarding flows.

## Testing guidance (to add)
- Unit: brand service identity/rules AI uses cache keys, fallbacks, and scoping; slug/tenant guardrails.
- Integration: routes enforce RBAC + plan gating; AI endpoints persist AIInsight and emit events.
- Frontend: hooks invalidate caches; forms validate JSON fields; AI buttons respect permissions.
