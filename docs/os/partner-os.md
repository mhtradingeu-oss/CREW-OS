# Partner OS

## Purpose
Unifies all partner types (dealers, distributors, salons, stands, white-label owners, affiliates) under a cohesive registry that manages contracts, pricing tiers, performance, and AI scoring.

## Responsibilities
- Store partner metadata (type, company, region, tier, performance) and user links.
- Control pricing level access, track orders, monitor loyalty, and publish partner-specific promotions.
- Integrate AI Partner Advisor to assess partner health, expansion readiness, and compliance.

## Inputs
- Partner applications, contracts, onboarding documents, pricing expectations.
- Order history from Sales/Dealer/Stand modules.
- AI signals (performance trends, risk, loyalty participation) and external compliance data (CNPN, ISO references for distributors).

## Outputs
- Partner dashboards (orders, loyalty, performance, AI score) and automation triggers for renewals, interventions, or loyalty bonuses.
- Events for Automation/Finance (payout due, pricing change) and Notification (partner alerts).

## Internal Components
- Models: `Partner`, `PartnerContract`, `PartnerPricing`, `PartnerOrder`, `PartnerOrderItem`, `PartnerTier`, `PartnerPerformance`, `PartnerAIInsight`, `PartnerUser`.
- Partner portal UI supporting order history, contract downloads, loyalty dashboards, and AI storyboards.
- Integration with `AI Partner Advisor`, `Automation OS`, `Notification OS`.

## Required API Endpoints
- `GET /api/v1/partners/list`, `POST /api/v1/partners/create`, `GET /api/v1/partners/:id`, `POST /api/v1/partners/:id/pricing`, `GET /api/v1/partners/:id/orders`.
- `GET /api/v1/dealers/list`, `/dealers/orders`, `/dealers/ai/insights`, `/dealers/ai/re-order-suggestion`.
- AI: `POST /api/v1/partners/ai/insights`, `POST /api/v1/partners/ai/price-anomaly`.

## Required Data Models
- `Partner`, `PartnerContract`, `PartnerPricing`, `PartnerOrder`, `PartnerTier`, `PartnerAIInsight`, `User`, `AIInsight`.

## Integration Notes
- Partners consume Pricing OS guardrails, Finance OS payouts, and Automation OS events for supply replenishment.
- Dealer/Partner dashboards read from CRM (accounts), loyalty (points), Stand OS (if paired), and Marketing (co-branded campaigns).
