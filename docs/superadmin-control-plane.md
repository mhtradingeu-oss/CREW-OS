# Super Admin Control Plane (F5)

## Scope
Full read-only control plane for platform governance under `/superadmin/*`, secured by `RequireRole("SUPER_ADMIN")` and rendered via the dedicated `SuperAdminShell` (sidebar + topbar distinct from tenant UI).

## Layout & Navigation
- Shell: `SuperAdminShell` (sidebar `SuperAdminSidebar`, topbar `SuperAdminTopbar`) with gradient styling. Topbar now exposes Command Palette (Ctrl/Cmd+K) and “Ask Hairo” buttons that open the global assistant drawer in safe-mode.
- Access: non-super-admins are redirected to `/dashboard`; unauthenticated -> `/auth/login`.
- Navigation map (all items have icons):
  - `/superadmin` Overview
  - `/superadmin/tenants` list, `/superadmin/tenants/[tenantId]` detail tabs
  - `/superadmin/brands`
  - `/superadmin/plans`
  - `/superadmin/users`
  - `/superadmin/ai-agents`
  - `/superadmin/ai-safety/firewall`, `/banned-actions`, `/events`
  - `/superadmin/ai-monitoring`
  - `/superadmin/system-health`
  - `/superadmin/platform-ops`

## Pages (read-only)
- Overview: KPIs (tenants, active/suspended, AI calls/day), safety summary, recent safety incidents, recent AI executions, platform status.
- Tenants: table with status/plan; detail tabs for overview, plan history, feature flags, users, activity timeline.
- Plans & Feature Flags: plan catalog from shared `PlanInfo`, feature summaries, tenant overrides JSON viewer.
- Brands: brand list per tenant.
- Users & Roles: platform users list.
- AI Agents & Autonomy: agent cards with scope, autonomy level, allowed/restricted actions, budget profile.
- AI Safety: firewall rules, banned actions, safety events log.
- AI Monitoring: executions, fallbacks, errors, per-tenant analytics; now includes Recharts line/bar visuals (calls/day, cost vs. calls), filters, pagination, and TableWithToolbar patterns.
- System Health: API uptime, DB status, queues, background jobs, placeholder DB status card.
- Platform Ops: RBAC role definitions, permission codes, policy JSON viewer, event types/subscribers (read-only).

## Data Sources
- Mock/stub data lives in `apps/front-end/lib/superadmin/mock-data.ts` (tenants, plans, agents, safety events, monitoring metrics, RBAC, policies, overrides, brands, users).
- Shared types: `PlanInfo`/`PlanTier` from `@mh-os/shared` to keep plan data type-safe.
- All UI interactions are read-only placeholders pending backend wiring.

### API contracts (proposed)
- GET `/api/v1/ai/monitoring/executions?status=success|fallback|error&tenant=<id>&page=<n>&pageSize=<n>`
- GET `/api/v1/ai/monitoring/fallbacks?tenant=<id>&page=<n>&pageSize=<n>`
- GET `/api/v1/ai/monitoring/errors?tenant=<id>&page=<n>&pageSize=<n>`
- GET `/api/v1/ai/monitoring/analytics` → aggregates (success rate, top agents/models, costs, latency per tenant)

## AI Safety Considerations
- Access strictly gated to `SUPER_ADMIN` via `RequireRole` and `hasRole` checks; non-admins redirected away.
- No mutation actions rendered; tables/buttons are view-only with clear hints.
- Safety sections surface severity and status badges for quick triage; fallbacks and blocked statuses highlighted.

## Backend Alignment TODOs
1) Wire real APIs for tenants, plan history/overrides, feature flags, users, brands.
2) Connect AI safety endpoints (firewall, banned actions, safety events) to backend read endpoints only.
3) Connect AI monitoring to real telemetry (executions, fallbacks, costs, per-tenant analytics) and align with contracts above; charts already wired to mock data via Recharts.
4) Hook system health to backend health/queue/job endpoints.
5) Surface real RBAC roles/permission codes/policies/event subscribers from platform-ops service.
6) Add filter/search/pagination params to list queries once APIs are available.

## Checks
Run in repo root:
- `npm run typecheck -w mh-os-admin`
- `npm run build -w mh-os-admin`
