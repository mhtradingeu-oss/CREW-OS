# Database Governance Guidelines

## Fresh DB Rule (non-negotiable)
All Prisma migrations must be verifiable on a brand-new, empty PostgreSQL database before we promote a build beyond development. Any local or CI check that runs `prisma migrate deploy` must start with a fresh catalog so we can catch missing objects, enum conflicts, or index-on-missing-column errors early. This rule protects staging and production from drift or implicit state assumptions.

## Migration Execution Policy
- **CI / Staging / Production:** Always run `npx prisma migrate deploy` against the target database. That is the only supported command in those environments. The existing `ci/test-integration-backend` job spins up a brand-new Postgres service, points `DATABASE_URL_TEST` at it, and fails if `migrate deploy` errors, so this gating job already enforces the policy.
- **Local developer workflows:** Developers may use `npx prisma migrate dev` solely on local sandboxed databases. Do _not_ run it from within CI, staging, or production. Make sure `DATABASE_URL` is unset for CI so we never accidentally target a shared environment.

## Idempotent Development & Phase Migrations
Every new migration that touches the schema must be safe for repeated execution and for partially-applied states:
1. Assume the earlier `CREATE` statements may or may not have run yet.
2. Guard every new table, enum, index, foreign key, and column addition with a repeatable check.
3. Avoid destructive resets—do not drop/recreate tables unless you can handle data migration and revert paths outside this governance document.

### Allowed guard patterns (examples)
- `CREATE TABLE IF NOT EXISTS "MyTable" (...)` keeps table creation safe when the table already exists.
- `ALTER TABLE "MyTable" ADD COLUMN IF NOT EXISTS "newColumn" TEXT;` lets you add columns safely even if the migration partially ran earlier.
- Enums must be wrapped in a `DO $$` guard that checks `pg_type`:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MyEnum') THEN
      CREATE TYPE "MyEnum" AS ENUM ('VALUE_A', 'VALUE_B');
    END IF;
  END $$;
  ```
- Foreign keys must be guarded via `pg_constraint`:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'MyTable_fk') THEN
      ALTER TABLE "MyTable" ADD CONSTRAINT "MyTable_fk" ...;
    END IF;
  END $$;
  ```
- Index creation must check both the index and the target columns via `pg_indexes` and `information_schema.columns`:
  ```sql
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'MyTable_col_idx')
    AND EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = 'MyTable'
        AND column_name = 'col'
    ) THEN
      CREATE INDEX "MyTable_col_idx" ON "MyTable"("col");
    END IF;
  END $$;
  ```
- Enum value additions should be wrapped in a guard that queries `enum_range(NULL::MyEnum)`.

The script `scripts/prisma_guard.py` automates these transformations across the historical migration tree and serves as a template for future changes; follow its patterns when editing SQL by hand.

### Forbidden patterns
- **`npx prisma migrate dev` in CI/staging/production:** never run this command outside a developer workstation.
- **Schema recreation scripts:** do not run `prisma db push` or any ad-hoc SQL that re-creates existing tables in production; rely on incremental, guarded migrations instead.
- **Unsafe index/constraint creation:** never emit raw `CREATE INDEX` or `ALTER TABLE ... ADD CONSTRAINT` without the guard patterns above.
- **Assuming `DATABASE_URL` is available in CI:** CI workflows already guard against this. Use a dedicated `DATABASE_URL_TEST` and leak no credentials into `DATABASE_URL`.

## Recovery Policy for Production Migration Failures
If `prisma migrate deploy` fails in production:
1. **Pause the rollout.** Do not issue more migrations until the failure is triaged.
2. **Capture the error and its context** (the failed migration name, Postgres error, stack trace, and schema drift state).
3. **Inspect the production schema manually** (`psql` or your DB console) to verify which objects exist; avoid repeating the failing statement without a guard.
4. **Add a guard or manual fix** that safely handles the existing state, then promote a new migration that references the exact object names.
5. **Use `npx prisma migrate resolve --applied <migration>`** only when you are certain a migration was successfully applied but Prisma marked it as failed. Never manually edit `_prisma_migrations` without coordination.
6. **Rerun `prisma migrate deploy`** against a copy of the production database (or an identical staging replica) before reapplying to production.
7. **Document the incident** in the incident tracker/report and notify the on-call database steward.

Following this policy keeps Phase B (Prisma Fresh DB Guarantee) intact: every migration must succeed deterministically on a brand-new Postgres instance, and `prisma migrate deploy` is our single source of truth for CI, staging, and production.
