# Prisma Migrations Policy

## CI (GitHub Actions)
- CI always runs on a disposable, ephemeral test database.
- CI uses `prisma migrate reset --force --skip-seed` to ensure a clean schema for integration tests.
- No production or persistent data is ever affected by CI.
- Migration failures in CI are only valid if they would also fail on a clean database.

## Local Development
- Developers may use `prisma migrate reset` if they do not need to preserve local data.
- If you need to keep local data, use `prisma migrate resolve` or fix migration conflicts manually.
- Never delete or squash existing migrations.
- Always commit new migrations and schema changes.

## Production
- Production uses `prisma migrate deploy` only.
- Never use `prisma migrate reset` or any destructive command in production.
- All migrations must be applied in order, preserving data and history.

## General Rules
- Do NOT delete or rewrite migration history.
- Do NOT squash migrations.
- If a migration fails due to duplicate table/column, investigate for accidental re-creation or manual DB drift.
- If you see `relation already exists` in CI, check for duplicate table creation in migrations and resolve safely.

---

For more details, see the backend README and contact the engineering team for migration reviews.