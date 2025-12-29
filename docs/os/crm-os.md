# CRM OS

## Purpose
Acts as the lifecycle hub for B2C + B2B customers, leads, deals, activities, and omnichannel communications while feeding AI scoring and Virtual Office narratives.

## Responsibilities
- Capture and deduplicate people (`Person`), companies (`Company`), leads, deals, and pipeline stages.
- Track CRM-specific tasks, notes, interactions, statuses, and ownership (sales rep, partner, AI agent).
- Provide communication tooling (email, WhatsApp, SMS, in-app) for follow-ups, automation triggers, and AI responses.

## Inputs
- Lead sources (ads, affiliates, stand visits, sales reps, landing pages).
- Marketing segments, sales activities, product/price updates.
- AI scoring results from `AI CRM Manager` and Virtual Office action items.

## Outputs
- Lead summaries, segments, scoring history for dashboards and AI agents.
- CRM tasks/notes for automation (follow-ups, churn prevention, onboarding).
- Events (`lead.created`, `deal.won`, `crm.task`) consumed by Automation, Marketing, Sales, AI Brain.

## Internal Components
- Models: `Person`, `Company`, `Lead`, `Pipeline`, `PipelineStage`, `Deal`, `DealProduct`, `CRMTask`, `CRMNote`, `InteractionLog`.
- AI CRM Manager (scoring, next actions) hooking into `orchestrateAI`.
- Communication layer, template runner, and automation-friendly webhook connectors.

## Required API Endpoints
- `GET /api/v1/crm/contacts`, `POST /api/v1/crm/lead/create`, `PUT /api/v1/crm/lead/update/:id`, `POST /api/v1/crm/deal/create`, `POST /api/v1/crm/task/create`.
- AI: `POST /api/v1/crm/ai/next-actions`, `/crm/ai/lead-score`, `/crm/ai/follow-up`.

## Required Data Models
- `Person`, `Company`, `Lead`, `Pipeline`, `PipelineStage`, `Deal`, `CRMTask`, `CRMNote`, `InteractionLog`, `AIInsight`.

## Integration Notes
- Works with Marketing OS for segments/campaigns and with Sales OS for territory/rep assignment.
- Sends churn/follow-up triggers to Automation OS and Notification OS.
- AI scores feed AI Brain/Virtual Office as part of AI reports, ensuring decisions honor Brand guardrails.
