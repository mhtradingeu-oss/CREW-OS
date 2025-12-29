# Incidents & Rollbacks

This document captures the accountability layer for CrewOS automation (Phase 16). It does _not_ introduce new automation behaviors — it codifies how we **stop**, **audit**, and **reverse** automation when something goes wrong.

## Incident taxonomy

Each detected incident is recorded via `AutomationIncident` with these fields:

- `incidentId`: unique identifier for cross-system tracing
- `type`: one of `AUTOMATION_FAILURE`, `DATA_INCONSISTENCY`, `SECURITY_RISK`, `HUMAN_ERROR`, `SYSTEM_MISCONFIGURATION`, `UNKNOWN`
- `severity`: `LOW` / `MEDIUM` / `HIGH` / `CRITICAL`
- `relatedExecutionId` / `relatedApprovalDecisionId`
- `detectedAt` / `detectedBy` (`SYSTEM` / `HUMAN`)
- `status`: `OPEN` → `MITIGATED` → `RESOLVED`

Incidents emit `incident.created`, `incident.mitigated`, and `incident.resolved` logs and increment `automation_incident_total{type,severity,status}`. Every automation failure that bubbles up to the execution layer now records an incident before the error is rethrown.

## Kill switches (hard stops)

Kill switches are synchronous, fail-closed checks that run:

1. **Global** (`AUTOMATION_GLOBAL_DISABLED`) — checked as soon as the `AutomationExecutionService` receives a request and again just before any action executes.
2. **Brand** — stored in `AutomationBrandKillSwitch`. Reads are logged and blocked attempts increment `automation_kill_switch_activated{scope="brand"}`.
3. **Execution** — persisted in `AutomationExecutionKillSwitch`. Targeting either an approval decision or a pending execution allows operators to revoke a single flow.

Every blocked attempt raises a structured log (`automation.kill_switch.blocked`) with scope, reason, and the affected approval/execution IDs.

## Rollback philosophy

Rollback is treated as a _new, compensated action_:

- It must be explicitly requested, human-approved, and logged (`AutomationRollbackExecutionLedger`).
- Rollbacks require `approvedById`, a snapshot reference, and a **clear scope description** (“what is reverted, what remains”).
- Rollbacks are **not** automatic undos — they are human-orchestrated compensating actions that are idempotent by design and linked to the original execution + incident.
- `automation_rollback_total{stage,status}` tracks started/finalized rollbacks.
- Rollback requests are permitted only when:
  - the execution result is `FAILED` or `SUCCESS` (i.e., completed),
  - the incident exists and is still `OPEN`,
  - the rollback window (`AUTOMATION_ROLLBACK_WINDOW_MINUTES`, default 60) has not expired,
  - no prior rollback is recorded for that execution.
- Once a rollback request begins, the incident moves to `MITIGATED`; after a successful rollback it becomes `RESOLVED`.

## Incident → Rollback → Resolution flow

The mandatory lifecycle is:

1. **Incident detected** (automatic failures or human reports).
2. **Incident recorded** with type/severity/scope metadata (`incident.created` log).
3. **Kill switch (if needed)** — target execution, brand, or the entire system via the above controls.
4. **Human review** (does the incident match policy?).
5. **Rollback approved** (`rollback:approve` permission required to request a rollback).
6. **Rollback executed** (`rollback:execute` permission required for execution completion).
7. **Incident resolved** (`incident.resolved` log, rollback ledger status updated).
8. **Post-incident notes** recorded via the incident’s resolution metadata.

No steps can be skipped; rollbacks without incidents are rejected by guard logic (`INCIDENT_REQUIRED_FOR_ROLLBACK`).

## Observability

- **Metrics**
  - `automation_incident_total{type,severity,status}`
  - `automation_kill_switch_activated{scope}`
  - `automation_rollback_total{stage,status}`
- **Logs**
  - `incident.created`, `incident.mitigated`, `incident.resolved`
  - `rollback.started`, `rollback.completed`, `rollback.failed`
  - `automation.kill_switch.blocked`
  - Execution-level logs already include `execution.start`, `execution.success`, `execution.failed`

There is intentionally no external alerting, paging, or SMS in this phase; observability remains internal.

## Permissions & authority

RBAC codes introduced in this phase:

- `incident:create` / `incident:read` — for teams that operate incident registers.
- `rollback:approve` — required to approve a rollback request.
- `rollback:execute` — required to mark a rollback as executed/failed.
- `automation:kill` — used for brand-level kill-switch toggles.

No role receives all permissions by default; RBAC roles must explicitly opt in.

## Legal boundaries & operator checklist

Operators must keep manual custody notes in the incident record’s metadata, documenting:

1. **What triggered the incident** (logs, error codes, human report).
2. **Severity assessment** and rationale for kill-switch invocation.
3. **Rollback scope** (what is being reverted vs. what is retained).
4. **Approval metadata** (`approvedById`, approval timestamp, snapshot reference).
5. **Completion notes** once rollback succeeds or fails.

Checklist:

1. Confirm automation is globally or selectively disabled before large rollbacks.
2. Validate the incident exists and matches the execution/approval in question.
3. Capture the rollback reason, snapshot ID, and scope. Route for human approval.
4. Execute rollback using compensating actions; mark ledger `EXECUTED` or `FAILED`.
5. Resolve the incident (status → `RESOLVED`) and append post-incident notes.

## Environment variables

- `AUTOMATION_GLOBAL_DISABLED` (boolean, default `false`): fail-safe switch that immediately blocks all automation traffic.
- `AUTOMATION_ROLLBACK_WINDOW_MINUTES` (number, default `60`): how long after execution a rollback request is allowed.
