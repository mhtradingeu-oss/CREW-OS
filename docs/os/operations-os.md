# Operations OS

## Purpose
Coordinates daily operations (tasks, activity logs, scheduled jobs) and provides platform health insights to admins.

## Responsibilities
- Manage operations tasks, checklists, escalations, and events for manufacturing, logistics, approvals.
- Persist Activity Log entries with event metadata, brand/user references, and actions to support auditing and platform ops dashboards.
- Power scheduled jobs (cron-like) that automation or platform health monitors depend on.

## Inputs
- Requests from admin/operations teams, automation events, scheduled job definitions, activity log postings from every OS.

## Outputs
- Task dashboards, activity log timelines, scheduled job metrics, automation triggers for follow-ups.
- Platform Ops endpoints (health, job lists, audit exports) for administrators via `docs/phase-4-architecture.md`.

## Internal Components
- Models: `OperationsTask`, `ActivityLog`, `ScheduledJob`, `ActivityCategory`, `PlatformMetric`.
- Subscribers to Event Bus that store structured activity data.

## Required API Endpoints
- `GET /api/v1/operations/tasks`, `POST /api/v1/operations/tasks`, `GET /api/v1/activity-log`, `POST /api/v1/activity-log/search`, `GET /api/v1/platform-ops/health`, `GET /api/v1/platform-ops/jobs`.

## Required Data Models
- `OperationsTask`, `ActivityLog`, `ScheduledJob`, `User`, `AIInsight` (for automation action items).

## Integration Notes
- Central hub for virtual office action logging, Platform Ops dashboards, Automation OS (failure traces), and Notification OS (ops alerts).
