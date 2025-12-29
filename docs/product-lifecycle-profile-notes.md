# Product Lifecycle & Profile Updates

## Scope
- Adds lifecycle/product profile fields to BrandProduct plus supporting relations (localizations, compliance, distribution, marketing, social proof, analytics hooks, SEO/social links).
- Extends product API create/update/import/export + listing filters; CSV export now includes lifecycle/identifier/tag columns.
- Aligns pricing drafts/types with product linkage; regenerates Prisma client.

## API surface changes
- New request/response fields on product create/update/import: `lifecycleStage`, `barcode`, `ean`, `upc`, `qrCodeUrl`, `tags` (string[]), and profile blobs: `marketingProfile`, `seoProfile`, `distributionProfile`, `complianceProfile`, `localizationProfile`, `socialProof`, `analyticsProfile`.
- New query filter: `lifecycleStage` (list/export).
- CSV export columns added: `barcode`, `ean`, `upc`, `qrCodeUrl`, `lifecycleStage`, `tags` (JSON stringified).
- Product responses now include the above fields; tags serialized/deserialized from JSON.

## Prisma/schema
- `BrandProduct` gains lifecycle + identifiers + profile JSON columns and relations to:
  - `ProductLocalization`, `ProductCompliance`, `ProductDistributionProfile`, `ProductMarketingProfile`, `ProductSocialProof`, `ProductAnalyticsHook`
  - Reverse links added on `Brand` and `BrandProduct` for new relations and existing SEO/social reports.
- Action: run `npx prisma generate` after pulling to refresh client; run `npm run typecheck --workspace apps/back-end`.

## Frontend handoff
- Add lifecycleStage filter and column to product list; show tags.
- Product detail: Lifecycle section (stage + identifiers + tags) and tabbed editors for profile blobs (JSON textareas/code editors) with optional AI assist.
- Import/export UI: accept/render new fields; surface schema hint showing new columns.
- Pricing header: show lifecycleStage badge and identifiers; drafts read-only view of lifecycle/tags.

## Runbook
1) Pull latest + install deps.
2) `cd apps/back-end && npx prisma generate` (or `npm run postinstall` root).
3) `npm run typecheck --workspace apps/back-end`.
4) Smoke test product endpoints: create/update/import/export; verify lifecycleStage filter and CSV columns.
5) Frontend: update product/pricing pages per handoff; validate import/export UI.
