# Notification OS

## Purpose
Delivers configurable multi-channel messages for alerts, automation events, AI recommendations, and system health warnings.

## Responsibilities
- Manage notification templates (email, SMS, WhatsApp, in-app, Telegram, push) and variables.
- Handle severity tagging, read/unread logic, bulk actions, and automation integration.
- Surface Virtual Office/AI automation action outcomes in the global inbox and provide CTA links into modules.

## Inputs
- Automation events (price guardrail breaches, low stock, QA alerts), AI action items, system health signals, CRM/Finance triggers.
- Template definitions and channel configs per brand/partner.

## Outputs
- Notification feeds, unread counters, toast prompts, inbox filters, and history for Platform Ops dashboards.
- API responses for front-end dropdown/bell, global unread counts, and drill-down to Activity Log entries.

## Internal Components
- Models: `Notification`, `NotificationTemplate`, `NotificationChannel`, `NotificationStatus`.
- Builders that render JSON payloads for each channel and track deliveries/logs in `ActivityLog`.

## Required API Endpoints
- `POST /api/v1/notification/send`, `GET /api/v1/notification/list`, `POST /api/v1/notification/template`, `GET /api/v1/notification/templates`.
- AI: `POST /api/v1/communication/ai/generate-template` to draft notification copy.

## Required Data Models
- `Notification`, `NotificationTemplate`, `NotificationChannel`, `ActivityLog`, `AIInsight`.

## Integration Notes
- Hooks to Automation OS (action-after automation), Communication OS (channel connectors), Platform Ops (alerts), Virtual Office (action item follow-ups), and Security OS (audit trail for sensitive notifications).
