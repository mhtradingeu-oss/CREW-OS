# MIGRATION_DECISION: 20260102145652_action_suggestion

## Decision
**Option A – mark as CORRECTIVE/ISOLATED.** This migration irreversibly drops enums, a handful of columns, and three tables that may already hold production data, so the safest course is to keep it guarded and only run it after manual verification.

## What the migration drops (with snippets from the SQL):
- `ALTER TABLE "AIAgentConfig" DROP COLUMN "configJson"`, `"createdAt"`, `"enabled"`, `"name"`, `"osScope"`, `"updatedAt"` and make `brandId` NOT NULL, so every existing agent config record must be re-validated before this runs.
- `ALTER TABLE "PartnerOrder"` removes `createdAt`, `status`, `total`, `updatedAt` and enforces a non-null `brandId`; `PartnerOrderItem` drops `createdAt`, `orderId`, `price`, `productId`, `quantity`, `updatedAt` while introducing a required `brandProductId`; `PartnerPricing` drops `createdAt`, `currency`, `netPrice`, `productId`, `updatedAt` while adding a required `brandProductId`.
- `ALTER TABLE "Plan" DROP COLUMN "featuresJson"` and add new `isActive`/`scope` columns, preserving the plan row but losing the legacy JSON payload.
- `DROP TABLE "AIBannedAction";` removes all records from the AI safety catalog.
- `DROP TABLE "FeatureUsageDaily";` and `DROP TABLE "PlanIntelligenceInsight";` both delete analytics tables that are later recreated, so any historical rows would be lost.
- Enum reductions: `AIExecutionStatus` loses `[ERROR,BLOCKED,FALLBACK,RETRY]` and `AIMonitoringCategory` collapses to a single `PLACEHOLDER` value (the old variants are dropped, meaning any rows using them would break or be removed).

## Risk matrix
- **Before hardening:** Running the migration in an environment with existing data would delete hours/days of AI logs, partner order history, and analytics tables while simultaneously tightening NOT NULL constraints and dropping core columns, so accidental execution in prod/staging would cause major outages.
- **After hardening:** The new `crewos.allow_corrective_migration_action_suggestion` guard raises an exception unless explicitly set to `'true'`, preventing `prisma migrate deploy` (and the new `db:migrate` script) from executing these steps automatically. The guard is documented in the migration comment and returns control immediately, so the only way to apply it is to run `SET crewos.allow_corrective_migration_action_suggestion = 'true';` within a maintenance window and acknowledge the data loss. The migration itself is unchanged, so rollback is still possible by re-running earlier migrations if the guard is unset.
