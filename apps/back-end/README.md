# RBAC Seeding

To synchronize all runtime permissions, roles, and mappings:

```sh
node ../../scripts/seed-rbac.mjs
```

This script is idempotent and will ensure the database matches the current codebase RBAC requirements.

## Verification Queries

Count permissions:
```sql
SELECT count(*) FROM "Permission";
```

Count roles:
```sql
SELECT count(*) FROM "Role";
```

Count role-permissions:
```sql
SELECT count(*) FROM "RolePermission";
```

List orphan permissions (not assigned to any role):
```sql
SELECT code FROM "Permission" p LEFT JOIN "RolePermission" rp ON p.code = rp."permissionCode" WHERE rp."permissionCode" IS NULL;
```
## CI & Branch Protection

- CI runs on GitHub Actions: see `.github/workflows/ci.yml`.
- **Required status checks for branch protection:**
	- Lint (Backend)
	- Typecheck (Backend)
	- Test (Unit)
	- Test (Integration)
- Enable branch protection in GitHub UI:
	- Require PRs before merging
	- Require status checks to pass before merging
	- Block force-pushes
	- Restrict who can push to main

## Local test commands (mirror CI)

- Typecheck backend: `npm run typecheck --workspace=mh-os-superapp-backend`
- Unit tests (no DB): `npm run test:unit --workspace=mh-os-superapp-backend`
- Integration tests (needs Postgres): `npm run test:integration --workspace=mh-os-superapp-backend`

See also: [docs/migrations-policy.md](../../docs/migrations-policy.md)
# MH-OS Superapp Backend

## Local development

- Install deps: `npm ci`
- Build: `npm run build`

## Production hardening (Phase 1)

- `NODE_ENV` must be explicitly set to `production` or `staging` before shipping; the loader enforces `ALLOWED_ORIGINS` and `JWT_SECRET` are not defaults.
- Tune the API-wide rate limiter with `API_RATE_LIMIT_WINDOW_MS` / `API_RATE_LIMIT_MAX` and the strict auth window with `API_RATE_LIMIT_STRICT_WINDOW_MS` / `API_RATE_LIMIT_STRICT_MAX`.
- The migration task now refuses to run in staging/production unless `DB_MIGRATION_ALLOW_STAGING=true` or `DB_MIGRATION_ALLOW_PRODUCTION=true` so you cannot accidentally deploy schema changes.
- Health probes are available at `/health`, `/health/liveness`, and `/health/readiness`; the readiness endpoint verifies Prisma can reach the database before accepting traffic.

## Database migrations

- Apply the latest migrations from this folder: `npm run db:migrate`
- To run ad-hoc commands you can still rely on Prisma directly: `npm run prisma -- migrate dev`
- Inside Docker: `docker compose exec backend npx prisma migrate deploy`

## Admin seeding

- Ensure `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set (see repo-level `.env` that already defines `m.superadmin@mhtrading-eu.com` / `Mgharabli@123$`).
- Seed/refresh the Super Admin account anytime with `npm run seed:admin` (or `npm run db:seed` for `prisma db seed`).
- The seed is idempotent: it creates the user if missing and updates the password/role/status if the account already exists.

## RBAC seeding

- Local (TypeScript): `npm run seed:rbac:local`
- After build (compiled JS): `npm run seed:rbac:dist`
- Inside running container: `docker compose exec backend node dist/modules/security-governance/rbac.seed.js`

## Brand seeding (dev-only)

- Seed HAIROTICMEN brand, categories, sample products, and AI configs: `npm run seed:brand:hairoticmen`
- Run after the database is up and migrations are applied.
- `npm run seed:core` now invokes the same brand seed so `npm run seed:all` is enough for a full demo setup; rerun `npm run seed:brand:hairoticmen` only when you need to refresh that catalog in isolation.
- Caveat: `seed:tenants` will re-link the brand to `mh-trading-ug`, while running `seed:core` alone leaves the brand detached from any tenant so OPS can assign it later.

## AI provider configuration

- Set `OPENAI_API_KEY` (or `AI_INTEGRATIONS_OPENAI_API_KEY` on Replit/managed deployments) so the backend can reach OpenAI without 401 errors.
- When running with Docker, add the same key to `.env.docker` or inject it via `docker compose` so the container inheriting that file can call OpenAI.
- The server now loads `.env` (and `.env.local` / `.env.docker` when present) next to the `back-end` package, so you can start the backend from the repo root without missing keys.
- Optionally override the base URL with `OPENAI_BASE_URL` (or `AI_INTEGRATIONS_OPENAI_BASE_URL`) if you are proxying requests. The default is `https://api.openai.com/v1`.

## Plan Intelligence Scheduler (BullMQ)

### Start Redis locally

You can run Redis using Docker:
```sh
docker run --name redis -p 6379:6379 -d redis:7
```
Or install via Homebrew:
```sh
brew install redis
brew services start redis
```

### Run Worker Manually

```sh
REDIS_URL=redis://localhost:6379 node src/core/workers/plan-intelligence.worker.js
```

### Enqueue Job Manually

```sh
REDIS_URL=redis://localhost:6379 node src/core/schedulers/plan-intelligence.scheduler.js
```

### Example Console Output

```
[plan-intelligence] Job added: plan-intelligence-2026-01-02
[plan-intelligence] Worker started
[plan-intelligence] Job started: plan-intelligence-2026-01-02
[plan-intelligence] Job completed: plan-intelligence-2026-01-02
```

If Redis is down or the worker is not running, the system continues normally and no side effects occur.

### Run AI Insight Classifier Manually

You can run the classifier directly using tsx:
```sh
npx tsx src/core/ai/plan-insight-classifier.ts
```

### Run AI Crew Intelligence Manually

You can run the AI Crew intelligence layer directly using tsx:
```sh
npx tsx src/core/ai/crew/ai-crew-intelligence.ts
```
