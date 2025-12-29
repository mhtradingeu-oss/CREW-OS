# AI Brain OS

## Purpose
Orchestrates AI agents, insights, learning loops, reports, and the Virtual Office meeting room so every OS benefits from the AI crew.

## Responsibilities
- Coordinate AI agents (pricing, marketing, CRM, sales, finance, operations, partner, stand, influencer, content).
- Store agent configs (`AIAgentConfig`), insights, reports, and learning logs for traceability.
- Run Virtual Office meetings, aggregate action items, and route outputs to Automations, Notifications, and Activity Log.

## Inputs
- AI prompts from Pricing, Marketing, CRM, Stand, Sales, Finance, Inventory, Partner, and Automation modules.
- Brand guardrails (`BrandAIConfig`) and policy constraints from Security & Governance OS.
- System events/data (pricing adjustments, campaign performance, lead status changes, stand alerts).

## Outputs
- AI Summaries, insights (`AIInsight`), reports (`AIReport`), learning journal entries, and Virtual Office action items.
- Virtual Office payloads (summary, agenda, risks, recommendations, action items) that feed automations and notifications.
- AI agent status, audit logs, and guardrail breaches reported to SuperAdmin/Platform Ops.

## Internal Components
- Models: `AIAgentConfig`, `AIInsight`, `AIReport`, `AILearningJournal`, `AIPricingHistory`, `AIKpiSnapshot`, `VirtualOfficeMeeting`, `VirtualOfficeActionItem`.
- `aiBrainService`, `aiInsightsService`, `aiReportsService`, `virtualOfficeService`, `aiAgentsService` (controllers + routes). 
- Orchestrator (`core/ai/orchestrator.ts`) that caches responses, enforces guardrails, and logs telemetry.

## Required API Endpoints
- `GET /api/v1/ai/agents`, `POST /api/v1/ai/run`, `POST /api/v1/ai/report`, `POST /api/v1/ai/virtual-office/meeting`, `GET /api/v1/ai/insights`.
- `POST /api/v1/ai/insights/refresh`, `POST /api/v1/ai/learning-log`, `GET /api/v1/ai/virtual-office/action-items`.

## Required Data Models
- `AIAgentConfig`, `AIInsight`, `AIReport`, `AILearningJournal`, `AIPricingHistory`, `VirtualOfficeMeeting`, `VirtualOfficeActionItem`, `ActivityLog`, `AIRestrictionPolicy`.

## Integration Notes
- Drives Virtual Office meetings described in `docs/03_ai-crew-and-virtual-office.md`: department tiles, meeting flows, outputs routed to Automation and Notifications.
- Feeds AI suggestions to the Pricing, Marketing, CRM, Sales, Stand, Finance, and Partner dashboards.
- Guards tie back to Security OS to respect AI restrictions and to SuperAdmin OS for configuration/approval.
