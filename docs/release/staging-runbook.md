# Staging Deployment Runbook (PHASE 7.3)

This runbook describes the deterministic steps before cutting a staging deployment. All commands assume you are inside `/Users/gharabli/Crewos`.

## 1. Environment variables (staging baseline)

Each variable below is required or strongly recommended for production-like staging. Copy from `apps/back-end/.env.example` and override as needed.

| Name | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV=staging` | Enables staging guards and telemetry. | Stage and prod share the same validation, so treat it as prod-like. |
| `DATABASE_URL` | Primary Postgres connection string. | Must point at the staging database; not `localhost` unless host is staging. |
| `REDIS_URL` | Redis used by rate limiting / caching. | Provide the staging Redis endpoint. |
| `JWT_SECRET` | JWT signing key. | Must differ from `DEFAULT_JWT_SECRET` in `env.runtime`. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seed admin login. | Used by smoke checks and marketing API verification. |
| `ALLOWED_ORIGINS` | CORS whitelist. | Required for `staging/production` to avoid the validator in `env.runtime`. |
| `API_RATE_LIMIT_*` | Rate limit configuration. | Defaults are safe; override only when tuning stage traffic. |
| `DB_MIGRATION_ALLOW_STAGING=true` | Gatekeeper for staging migrations. | Required before running `npm run db:migrate`. |
| `DB_MIGRATION_ALLOW_PRODUCTION=false` | Prevent accidental prod migrations from staging. | |
| `AUTOMATION_GLOBAL_DISABLED` / `AUTOMATION_EXECUTION_ENABLED` | Automation toggle. | Set `AUTOMATION_GLOBAL_DISABLED=true` to pause automation traffic momentarily. |
| `AUTOMATION_ROLLBACK_WINDOW_MINUTES` | Rollback window (default 60). | Keep positive. |
| `READINESS_ENABLED=true` | Enables `/ready` endpoint. | `READINESS_STRICT=true` will exit if dependencies fail; use only during validation. |
| `REDIS_URL`, `METRICS_ENABLED`, `HEALTH_INCLUDE_CORRELATION_ID` | Supporting services toggles. | Keep metrics on for observability.

Also include any AI provider secrets (`OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_API_KEY`, `OPENAI_BASE_URL`, `AI_PROVIDER`) if automation/AI features are exercised in staging.

## 2. Database migrations

1. Export the staging flags before running migrations.
   ```bash
   export NODE_ENV=staging
   export DB_MIGRATION_ALLOW_STAGING=true
   export DATABASE_URL="postgresql://staging_user:staging_password@postgres-staging:5432/mhos_staging?schema=public"
   ```
2. Run the migration guard plus Prisma deploy (the guard in `apps/back-end/scripts/migration-guard.ts` enforces the flags, while `migration-guard.js` inside CI warns about duplicate tables):
   ```bash
   cd apps/back-end
   npm run db:migrate
   ```
3. Confirm the guard logged `Database migrations allowed for staging` and there are no duplicate table warnings. The command will abort if `DB_MIGRATION_ALLOW_STAGING` is `false` or if `NODE_ENV` is not staging/prod.

## 3. Build & start backend server

```bash
cd /Users/gharabli/Crewos
npm run build --workspace=mh-os-superapp-backend
NODE_ENV=staging DEBUG=1 npm run start --workspace=mh-os-superapp-backend
```

The server listens on `PORT` (default `4000`) and honors `SERVER_HOST`. Keep the staging `NODE_ENV` to ensure the readiness polling path inside `apps/back-end/src/server.ts` swaps in the full router.

If you need to seed data first:
```bash
cd apps/back-end
npm run seed:core
npm run seed:tenants
```

## 4. Health & readiness validation

- Health endpoint (liveness): `curl -f "http://$STAGING_HOST:${PORT:-4000}/health"`
- Readiness (includes DB ping + event hub): `curl -f "http://$STAGING_HOST:${PORT:-4000}/ready" | jq`
  - Confirm `checks.db.ok` is `true` and `checks.eventBus` is either `{ "ok": true }` or `{ "unknown": true }`.
  - If `READINESS_STRICT=true` and `db.ok` fails, the process exits; with `false` it continues serving the bootstrap app.

## 5. Staging smoke checklist

1. **Verify event hub initialization**  
   ```bash
   curl -s "http://$STAGING_HOST:${PORT:-4000}/ready" | jq '.checks.eventBus'
   ```
   - Passing criteria: returns `{"ok":true}` or `{"unknown":true}` after the bootstrap stage finishes.
2. **Verify automation smoke runs end-to-end**  
   ```bash
   export NODE_ENV=staging
   export DATABASE_URL="postgresql://.../mhos_staging"
   npm run smoke:phase5 --workspace=mh-os-superapp-backend
   NODE_ENV=staging node --loader ts-node/esm --experimental-specifier-resolution=node apps/back-end/scripts/phase5-action-smoke.ts
   ```
   - Look for `[smoke] automation run recorded` and `[smoke] published AUTH_LOGIN_SUCCESS` logs.
3. **Verify marketing workflow endpoint responds**  
   ```bash
   TOKEN=$(curl -s -X POST "http://$STAGING_HOST:${PORT:-4000}/api/v1/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"email":"'$ADMIN_EMAIL'","password":"'$ADMIN_PASSWORD'"}' \
     | jq -r '.data.token')

   curl -s -H "Authorization: Bearer $TOKEN" \
     "http://$STAGING_HOST:${PORT:-4000}/api/v1/marketing?limit=1" | jq
   ```
   - Expect HTTP 200 and a non-empty `data` array; this confirms marketing routing/auth plumbing works.
   - If you need a campaign ID for deeper checks, reuse the first result to call `/api/v1/marketing/<id>/performance`.

## 6. PASS criteria checklist

- [ ] Migration guard logged staging approval and `npm run db:migrate` completed without errors.
- [ ] Backend build works and `/health` returns `200`.
- [ ] `/ready` reports the DB and event bus as `ready`.
- [ ] Automation smoke scripts finish with success logs for rule creation and event publish.
- [ ] Marketing endpoint returns `200` when authorized with the admin token.
- [ ] Any alerting or metrics pipelines tied to staging confirm the process started (`METRICS_ENABLED=true`).

Document the runbook path and CLI commands inside your release notes for future deployments.
