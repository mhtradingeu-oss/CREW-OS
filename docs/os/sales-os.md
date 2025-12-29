# Sales OS

## Purpose
Centralizes inside/outside sales (Sales Reps, territories, visits, pipelines) and ties them to orders, invoices, commissions, and loyalty.

## Responsibilities
- Manage Sales Rep profiles, territories, visit planning, quotes, orders, and performance KPIs.
- Log pipelines, activities, follow-ups, and collaboration with CRM, Stand, Dealer, and Partner ecosystems.
- Route automation (visit reminders, winning alerts) and AI recommendations (visit times, priority leads) through AI Sales Manager.

## Inputs
- CRM leads, product/pricing updates, partner orders, territory definitions, and competitor intelligence.
- Field data (quotes, visits, visit notes, orders, commission results).
- Virtual Office action items or automation requests for follow-ups.

## Outputs
- Quotes/orders tied to dealers/stands, commission records, performance snapshots, and automation triggers for invoicing or loyalty adjustments.
- `SalesVisit` and `SalesVisitNote` logs stored in Activity Log for auditing.
- AI insights (risky leads, territory gaps) feed Virtual Office and notifications.

## Internal Components
- Models: `SalesRep`, `SalesTerritory`, `SalesRepTerritoryAssignment`, `SalesRoutePlan`, `SalesRouteStop`, `SalesVisit`, `SalesVisitNote`, `SalesQuote`, `SalesQuoteItem`, `SalesOrder`, `SalesOrderItem`, `SalesRepKpiSnapshot`, `SalesCommission`.
- AI Sales Manager agent producing route optimization, visit advice, commission analysis.
- Territory maps and visit planners that reuse product and partner data.

## Required API Endpoints
- `GET /api/v1/sales-reps/list`, `POST /api/v1/sales-reps/create`, `POST /api/v1/sales-reps/route-plan`, `POST /api/v1/sales-reps/visit`, `POST /api/v1/sales-reps/quote`, `POST /api/v1/sales-reps/order`, `GET /api/v1/sales-reps/commissions`, `GET /api/v1/sales-reps/pipeline-activity`.
- AI: `POST /api/v1/sales-reps/ai/route-optimization`, `/sales-reps/ai/visit-advice`, `/sales-reps/ai/performance-insights`.

## Required Data Models
- `SalesRep`, `SalesTerritory`, `SalesRoutePlan`, `SalesVisit`, `SalesQuote`, `SalesOrder`, `SalesRepCommission`, `Deal`, `Lead`, `AIInsight`, `ActivityLog`.

## Integration Notes
- Sales OS listens to Pricing, Inventory, Finance, and Partner OS to keep quotes/orders aligned with product availability, pricing guardrails, and partner tiers.
- Works closely with CRM (leads/pipelines), Loyalty (targets, incentives), Automation (visit follow-ups), and Notification OS (order confirmations, commission hits).
