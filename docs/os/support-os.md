# Support OS

## Purpose
Handles omnichannel tickets (WhatsApp, email, chat), knowledge-assisted replies, and links with CRM/Automation for SLA-bound customer support.

## Responsibilities
- Log tickets, messages, tags, assignments, and SLA status with causal links to CRM leads or partners.
- Provide AI auto-reply suggestions using knowledge base content, flag escalations, and feed AI Brain with support insights.
- Integrate SMS/WhatsApp/email channels, deduplicate conversation threads, and store transcripts.

## Inputs
- Customer/support partner inquiries (ticket creation), conversation transcripts, automation alerts.
- Knowledge Base insights, AI suggestions, and CRM records.

## Outputs
- Ticket/agent dashboards, AI-recommended responses, automation triggers (assign to rep, escalate, send notifications), and escalation logs in Activity Log.

## Internal Components
- Models: `Ticket`, `TicketMessage`, `TicketTag`, `TicketAssignment`, `KnowledgeDocument` links, `AIInsight`.
- Channel connectors (WhatsApp, email, in-app) and automation helpers for SLA reminders.

## Required API Endpoints
- `GET /api/v1/support/tickets`, `POST /api/v1/support/tickets`, `POST /api/v1/support/messages`, `POST /api/v1/support/assign`, `GET /api/v1/support/ai/suggest-response`.

## Required Data Models
- `Ticket`, `TicketMessage`, `TicketAssignment`, `KnowledgeDocument`, `AIInsight`.

## Integration Notes
- Links to CRM for customer records, to Automation for escalations, to Notification for reply confirmations, and to AI Brain for summarizing top issues.
