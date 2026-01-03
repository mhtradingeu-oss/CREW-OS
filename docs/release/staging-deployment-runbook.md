# MH-OS Superapp Staging Deployment Runbook (Phase 7.3)

**Location:** `/docs/release/staging-deployment-runbook.md`

---

## 1. Required Environment Variables

Set all required environment variables before starting. Reference both the `env.runtime` schema and `.env.example` in `apps/back-end/`.

**Key variables:**
- `NODE_ENV=staging`
- `DATABASE_URL` (staging DB connection string)
- `JWT_SECRET` (secure random string)
- `EVENT_HUB_URL` (staging event hub endpoint)
- `REDIS_URL` (if used)
- `PORT` (default: 4000)
- `FRONTEND_URL` (staging frontend URL)
- Any other required by `.env.example` or `env.runtime` schema

**How to set:**
```sh
cp apps/back-end/.env.example apps/back-end/.env
# Edit apps/back-end/.env as needed
```

---

## 2. Step-by-Step Deployment Commands

### a) Install dependencies
```sh
cd /Users/gharabli/Crewos
npm install
```

### b) Generate Prisma client
```sh
cd apps/back-end
npx prisma generate
```

### c) Apply DB migrations (with migration-guard)
```sh
npm run prisma migrate deploy
# Confirm DB target is staging if prompted
```

### d) Build backend
```sh
cd /Users/gharabli/Crewos
npm run build
```

### e) Start server
```sh
cd apps/back-end
npm run start
```

---

## 3. Readiness Verification

### /health
- **Expected:** HTTP 200, `{ status: 'ok' }`
- **Check:**
```sh
curl -i http://localhost:4000/health
```

### /ready
- **Expected:** HTTP 200, `{ ready: true, db: true, eventHub: true }`
- **Check:**
```sh
curl -i http://localhost:4000/ready
```
- **If `/ready` stays false:**
	- Check DB connection and credentials
	- Check event hub URL and logs for `initEventHub()`
	- Restart server after fixing issues

---

## 4. Staging Smoke Checklist
- [ ] **Automation smoke:** Trigger a test automation event and verify logs (Phase 5)
- [ ] **Marketing execution endpoint:**
```sh
curl -i http://localhost:4000/api/v1/marketing/workflow
```
- [ ] **Competitor scan endpoint:**
```sh
curl -i http://localhost:4000/api/v1/competitor/scan
```

---

## 5. Rollback-Safe Rules

- **Do NOT rollback if:**
	- Incident is LOW/MEDIUM severity and a forward-fix is possible
	- DB/data changes are not reversible (no down migration)
	- Rollback window expired (`AUTOMATION_ROLLBACK_WINDOW_MINUTES`)
- **Forward-fix instead if:**
	- Issue can be safely patched without reverting
	- DB schema/data cannot be rolled back
	- Stakeholders approve forward-fix

---

## PASS/FAIL Criteria for Staging Readiness
- [ ] All required env vars set and loaded
- [ ] Dependencies installed, Prisma client generated, migrations applied
- [ ] Server builds and starts with no errors
- [ ] `/health` and `/ready` return 200 with expected JSON
- [ ] Automation, marketing, and competitor endpoints respond 200

---

**End of runbook.**

---

# Rollback Drill (Phase 7.4)

## When to Rollback vs. Forward-Fix (Decision Tree)

**Trigger a rollback if:**
- Incident severity is **HIGH** or **CRITICAL** (e.g., data loss, security risk, system misconfiguration, automation failure with business impact)
- Incident is recorded and status is `OPEN`
- The issue cannot be forward-fixed within the rollback window (`AUTOMATION_ROLLBACK_WINDOW_MINUTES`, default 60)
- Stakeholders approve rollback (see RBAC: `rollback:approve`)

**Forward-fix if:**
- Incident is **LOW** or **MEDIUM** severity and a safe, quick fix is possible
- Rollback window has expired
- DB/data changes are not reversible and a compensating migration is required

---

## Rollback Steps (Human-in-the-Loop)

1. **Incident Review:**
	- Confirm incident is recorded (`incident.created` log, status `OPEN`)
	- Assess severity and scope
2. **Approval:**
	- Obtain explicit approval from authorized operator (`rollback:approve` RBAC)
	- Document approval metadata (who, when, what)
3. **Prepare for Rollback:**
	- Identify previous stable release tag (e.g., `git tag` or release note)
	- Ensure automation is globally or selectively disabled if needed (`AUTOMATION_GLOBAL_DISABLED`)
4. **Rollback Code:**
	- Checkout previous release tag:
	  ```sh
	  git fetch --all --tags
	  git checkout <PREVIOUS_RELEASE_TAG>
	  ```
	- Rebuild and restart backend:
	  ```sh
	  npm run build
	  npm run start
	  ```
5. **DB Migration Rollback Policy:**
	- **If DB migration rollback is NOT supported:**
	  - Document the incident and apply a forward-fix migration as soon as possible
	  - Never attempt to manually reverse migrations unless explicitly supported and tested
	- **If supported:**
	  - Run the appropriate migration rollback command (see Prisma docs, if enabled)
	  - Confirm DB schema matches previous release
6. **Verification:**
	- Check `/health` and `/ready` endpoints:
	  ```sh
	  curl -i http://localhost:4000/health
	  curl -i http://localhost:4000/ready
	  ```
	- Confirm key endpoints (e.g., `/api/v1/marketing/workflow`) respond 200
	- Review logs for `rollback.started`, `rollback.completed`, and incident status
7. **Post-Rollback Smoke Check:**
	- [ ] Event hub initializes (logs)
	- [ ] Automation event can be triggered and processed
	- [ ] Marketing workflow endpoint responds 200
8. **Finalize:**
	- Mark incident as `RESOLVED` if rollback is successful
	- Add post-incident notes to incident record

---

## Rollback Drill Checklist
- [ ] Incident recorded and severity assessed
- [ ] Approval documented
- [ ] Previous release tag identified
- [ ] Automation disabled if required
- [ ] Codebase rolled back and server restarted
- [ ] DB migration rollback handled (or forward-fix planned)
- [ ] Health/readiness endpoints return 200
- [ ] Key endpoints respond as expected
- [ ] Event hub, automation, and marketing workflow smoke checks pass
- [ ] Incident status updated and notes added

---

**Decision Tree Summary:**

| Condition | Action |
|-----------|--------|
| High/Critical incident, within rollback window, not forward-fixable | Rollback (with approval) |
| Low/Medium incident, or forward-fix possible, or window expired | Forward-fix |
| DB migration not reversible | Forward-fix migration |

---

Refer to `/docs/incidents-and-rollbacks.md` for full policy details.
