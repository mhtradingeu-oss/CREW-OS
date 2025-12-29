# Pricing Insights OS

## Purpose
Produces advanced dashboards (heatmap, margin curves, channel competitiveness) and narrative stories to guide pricing decisions.

## Responsibilities
- Calculate profitability metrics, channel insights, and AI narratives (risk/opportunity) for every product.
- Surface insights in English/Arabic narratives, heatmaps, and dashboards (per `docs/ai/26_pricing-insights-os.md`).
- Feed Virtual Office and Platform Ops with explanation text, `AIInsight` records, and summary cards.

## Inputs
- Channel price data, cost breakdown, competitor deltas, product sales history, AI pricing proposals.

## Outputs
- Insights categories (profitability, channels, AI narratives) and dashboards (price heatmap, channel competitiveness, Amazon performance).
- AI-generated report text, events for Notification/Automation about risky channels.

## Internal Components
- Calculations for profitability, gap analysis, channel performance, competitor delta.
- Narrative generator that stores summaries in `AIInsight`.

## Required API Endpoints
- `GET /api/v1/pricing/insights`, `GET /api/v1/pricing/ai/narrative`, `GET /api/v1/pricing/heatmap`.

## Required Data Models
- `ProductPricing`, `CompetitorPrice`, `AIInsight`, `AIPricingHistory`.

## Integration Notes
- Works with Pricing Engine OS to provide human-readable journeys, with AI Brain for Virtual Office summary, and with Automation OS for alerting.
