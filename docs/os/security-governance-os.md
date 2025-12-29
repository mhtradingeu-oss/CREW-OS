# Security & Governance OS — System Manual

## Overview
- Mission: enforce RBAC, policies, AI guardrails, and auditability across all OS modules.
- Scope: roles/permissions, policy CRUD, AI restriction rules, plan-gated security actions, activity/audit logging.
- Mount point: `/api/v1/security` (Express) with plan context (`attachPlanContext`) and RBAC middleware.

## Data Models (Prisma)
- `User { id, email, password, role, rolesJson, tenantId?, brandId?, status, timestamps }` — primary actor; supports additional roles in `rolesJson`.
- `Role { id, name, description?, timestamps }` — unique role name.
- `Permission { id, code, description?, timestamps }` — unique permission code.
- `RolePermission { id, roleId, permissionId, timestamps }` — join table for RBAC.
- `Policy { id, name, category?, status, rulesJson?, brandId?, timestamps }` — governance rules tied to brands.
- `AIRestrictionPolicy { id, name, rulesJson?, timestamps }` — AI guardrail definitions.
- `AuditLog { id, userId?, action, entityType?, entityId?, metadata?, timestamps }` — security/audit trail.

## Backend API
- `GET /security/policies` — list; perms `security:policies:read|security-governance:read`.
- `GET /security/policies/:id` — fetch one; same perms.
- `POST /security/policies` — create; perms `security:policies:manage|security-governance:create`; plan `governance`.
- `PUT /security/policies/:id` — update; perms `security:policies:manage|security-governance:update`; plan `governance`.
- `DELETE /security/policies/:id` — delete; perms `security:policies:manage|security-governance:delete`; plan `governance`.
- `GET /security/rbac/roles` — list roles; perm `security:rbac:view`.
- `POST /security/rbac/roles` — create role; perm `security:rbac:manage`; plan `governance`.
- `PUT /security/rbac/roles/:id` — update role; perm `security:rbac:manage`; plan `governance`.
- `POST /security/rbac/roles/:id/permissions` — replace permissions; perm `security:rbac:manage`; plan `governance`.
- `GET /security/rbac/permissions` — list permissions; perm `security:rbac:view`.
- `POST /security/rbac/roles/assign` — assign role to user (primary or secondary); perm `security:rbac:manage`; plan `governance`.
- `POST /security/rbac/roles/revoke` — revoke secondary role; perm `security:rbac:manage`; plan `governance`.
- `GET /security/ai/restrictions` — list AI restrictions; perm `ai:manage|security:policies:read`.
- `POST /security/ai/restrictions` — create AI restriction; perms `ai:manage|security:policies:manage`; plan `aiInsights`.
- `PUT /security/ai/restrictions/:id` — update restriction; same perms/plan.
- `DELETE /security/ai/restrictions/:id` — delete restriction; same perms/plan.
- `GET /security/rbac/overview` — SUPER_ADMIN only RBAC snapshot.

## Frontend UX Map (App Router)
- `/dashboard/security/roles` — roles list, create role form, permission toggles, assign-role form.
- `/dashboard/security/permissions` — permission browser with role badges.
- `/dashboard/security/policies` — table + create form + delete.
- `/dashboard/security/policies/[id]` — detail/edit form for policy rules.
- `/dashboard/security/ai-restrictions` — list + create/delete AI restriction rules.
- Platform ops read-only view: `/dashboard/ops/security` (existing) shows users/roles summary.

## Plan Gating
- Governance-dependent: policy CRUD, role CRUD/assignment, permission updates (`requireFeature("governance")`).
- AI Insights-dependent: AI restriction CRUD (`requireFeature("aiInsights")`).
- Global attachPlanContext ensures feature checks per tenant/brand.

## RBAC Principles
- SUPER_ADMIN bypass for permission checks.
- Permissions resolved from primary `role` + secondary `rolesJson` via `resolvePermissionsForRoleSet` and `rolePermission` table.
- Policy evaluation overlays additional allow/deny per role/brand/tenant (JSON rules). Required perms enforced by `requirePermission` middleware.

## AI Safety Integration
- Policy create/update/delete triggers `logPolicyAiSummary` using orchestrator keys `security.policy.analysis` with monitoring + safety events.
- AI restriction CRUD emits `ai.restriction.updated`; intended for AI Monitoring/AI Safety subscribers.
- All AI calls include brand context and deterministic fallbacks; monitoring logged via `ai-monitoring` utilities.

## Automation & Events
- Events emitted: `security.policy.created|updated|deleted`, `security.role.assigned`, `security.role.revoked`, `ai.restriction.updated`.
- Activity stream subscriber writes to ActivityLog; audit entries written to `AuditLog` for security actions.
- Suggested automation templates:
	1) Notify admin on role changes.
	2) Lock AI agent when restriction policy updates.
	3) Weekly policy drift report.
	4) Flag unauthorized permission changes.
	5) Auto-escalate high-risk AI decisions.

## Recommended Workflows
- Create roles → map permissions → assign to users (primary for main role, secondary via `rolesJson`).
- Define governance policies per brand → update rules JSON with allow/deny lists → AI summary runs automatically.
- Add AI restriction policies to block risky actions; monitor AI safety dashboard.
- Review audit/activity feeds after each change; automate notifications via Automation OS.

## Risks / Future Enhancements
- Add UI for audit log timeline per policy/user.
- Add validation for rulesJson schema and versioning of policies.
- Extend role revocation to safely migrate primary roles instead of blocking.
