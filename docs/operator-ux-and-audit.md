# Operator UX & Audit Interfaces

## Operator visibility
- Operators (Admins / Brand Operators / Auditors) use `/api/v1/audit/*` read-only endpoints to see the system’s truth: snapshots, AI suggestions, approval decisions, automation executions, incidents, and rollbacks.
- Every item includes an ID, timestamp, tenant/brand context, actor, status, environment, and snapshot hash or reference so investigations remain fully traceable (correlation IDs and approval/execution/incident IDs are surfaced everywhere).
- Timelines support filters for brand, date range, status, and actor plus pagination; ordering is stable (newest first, then ID) so repeat queries return deterministic results.
- Deep inspection endpoints (`/api/v1/audit/approvals/:id` and `/api/v1/audit/executions/:id`) show who approved, the associated snapshot hash, guard verdicts, kill-switch state, rollback availability, and any correlated metadata.

## What operators cannot do
- Every `/api/v1/audit/*` endpoint is guarded by strict RBAC (`audit:read`, `ai:approvals:read`, `automation:read`, `incident:read`, etc.) and uses brand scoping (`Brand Operator` is bound to their brand while `SUPER_ADMIN` sees everything).
- There are no actions, buttons, or API mutations exposed; the operator surface is explicitly read-only and cannot trigger approvals, executions, or rollbacks.
- Approval ranks, execution results, or rollback statuses are informational only—operators cannot override governance or bypass kill switches (no `execute`, `approve`, or `rollback` verbs exist under these routes).

## Legal & governance boundaries
- Operators are ambassadors of the audit trail: all data they read reflects immutable records persisted by automation and AI services; they must not attempt to alter, fabricate, or forward these logs outside approved governance contexts.
- Access is limited to authorized roles only, and every request carries RBAC context, brand constraints, and correlation IDs for regulatory inspection.
- Any requested change beyond visibility (e.g., triggering automation, approving decisions, mutating incidents) must route through the normal execution/approval paths—there are no shortcuts through the audit UI.

## Example investigation flow
1. **Start with `snapshots`:** call `GET /api/v1/audit/snapshots` for the target brand/date to review raw AI snapshots (actor = system, environment, source, product ID, input/output data, and timestamps).
2. **Pull `suggestions`:** use `GET /api/v1/audit/suggestions` (filter by brand and actor) to understand what AI recommended and to capture correlation IDs for the subsequent approval chain.
3. **Inspect `approvals`:** call `GET /api/v1/audit/approvals/:id` to learn who approved, why (reason strings or policy notes if available), and which snapshot hash was locked in.
4. **Review `executions`:** inspect `GET /api/v1/audit/executions` to verify the approved automation ran, check the execution ID, result, kill-switch state, guard checks, and rollback links.
5. **Audit `incidents/rollbacks`:** if something failed, use `/incidents` to see severity, detection source, and exploit correlation IDs; `/rollbacks` shows any initiated recovery, scope, and outcome. Every step references the same correlation IDs/execution IDs so the story is traceable end-to-end.

## Incident response walkthrough
1. Detect an incident by reviewing `/api/v1/audit/incidents` (filter for `status=OPEN` and the relevant brand). Capture the `incidentId`, `executionId`, and `correlationId` from the timeline row.
2. Use `/api/v1/audit/executions/:executionId` to verify guard checks, snapshot hash, and whether any kill switches were triggered; note the `rollback` object for status and scope.
3. If a rollback exists, cross-reference `/api/v1/audit/rollbacks` to confirm the approving actor, reason, snapshot reference, and whether scopes/resources match the incident.
4. Record the entire chain (snapshot → suggestion → approval → execution → incident → rollback) to satisfy audit requirements and escalate to compliance/legal as needed.
5. Document findings, share correlation IDs with engineering/AI teams, and refrain from taking any in-product actions—the audit interface provides observation only.

Operators can trust these read-only views for investigative clarity while governance remains intact: no new schema, execution, or approval surface was created to bypass policy.
