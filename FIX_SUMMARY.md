# Fix Summary

- Added an explicit guard to `20260102145652_action_suggestion` so that the destructive drops of enums, columns, and tables can only run after a deliberate `SET crewos.allow_corrective_migration_action_suggestion = 'true'` opt-in, ensuring this corrective change cannot accidentally run in production.
- Declared a single official `db:migrate` script at the repo root and updated Docker to use it, aligning tooling with Prisma's `migrate deploy` workflow and keeping downstream automation untouched.
- Introduced `scripts/prisma-seed.mjs` so that `npx prisma db seed` launches `ts-node` from the repo root with an absolute `tsconfig.base.json`, fixing the ts-node resolution failure without touching seed logic.

These changes were validated with `npx prisma validate --schema apps/back-end/prisma/schema.prisma` and `npx prisma generate --schema apps/back-end/prisma/schema.prisma`, so the schema and generated client remain intact.
