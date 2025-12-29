# Pricing OS

## Purpose
Controls multi-channel strategic pricing (B2C, Amazon, Dealer Basic/Plus, Stand, Distributor, MAP, UVP) with guardrails, automation, and AI pricing advice.

## Responsibilities
- Store cost build-ups (factory price, inbound shipping, EPR, GS1, QC) and compute channel margins for each SKU.
- Manage pricing drafts with approvals, track AI-driven suggestions, and apply competitor intelligence (`pricing workbench`, competitor engine outputs).
- Emit price change events to Finance, Inventory, Notification, Automation, and AI Brain.

## Inputs
- Product cost breakdown from Product OS.
- Competitor pricing snapshots (Competitor Engine) and market signals (Social Intelligence, Finance KPIs).
- Guardrails from BrandRules and automation triggers (low margin, guardrail breaches, AI suggestions).

## Outputs
- Pricing matrix data for dashboards (channel ladder, heatmap, history).
- Draft records (`ProductPriceDraft`) with statuses (`Draft`, `Approved`, `Rejected`, `Applied`).
- AI insights, logs (`AIPricingHistory`), and event emissions for automation (price change alerts, competitor responses).

## Internal Components
- `ProductPricing`, `ProductPriceDraft`, `CompetitorPrice`, `AIPricingHistory`, `AILearningJournal`, guardrail validators, automation rule bindings.
- Pricing workbench UI concepts (overview, channel ladder, guardrails, AI suggestions, history) per `docs/pricing-workbench.md`.
- AI assist module (`pricing.ai.ts`) that calls the orchestrator with guardrail context.

## Required API Endpoints
- `GET /api/v1/pricing/base/:productId`, `POST /api/v1/pricing/update/:productId`, `POST /api/v1/pricing/draft/save`, `GET /api/v1/pricing/matrix/:productId`, `GET /api/v1/pricing/competitors/:productId`, `POST /api/v1/pricing/competitors/update`.
- AI: `POST /api/v1/pricing/ai/advice`, `/ai/forecast`, `/ai/competitor-strategy`, `/ai/heatmap`, `/ai/reprice`.
- Automation hooks: `/api/v1/pricing/automation/on-price-change`, `/on-competitor-change`.

## Required Data Models
- `ProductPricing`, `ProductPriceDraft`, `AIPricingHistory`, `CompetitorPrice`, `AILearningJournal`, `BrandRules`.

## Integration Notes
- Automations react to price changes (`AutomationRule` triggers, Notification/Communication sends alerts).
- Feeds Finance OS with updated revenue expectations and margin calculations.
- Works with AI Pricing Engine, AI Learning Loop, and Virtual Office for scenario planning and approvals.
