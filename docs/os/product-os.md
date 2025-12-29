# Product OS

## Purpose
Manages the master catalog (SKUs, product documents, enrichments, packaging, compliance) that powers Pricing, Inventory, Marketing, CRM, Stand/Dealer programs, and AI content generation.

## Responsibilities
- Ingest product metadata from CSVs/seeders (`product cv.csv`, `FINAL PRICE` sheets) and unify descriptions, USPs, how-to-use narratives, packaging specs, and media assets.
- Maintain SKU-level relationships to categories, lines (Premium, Professional), packaging, compliance references (CNPN, ISO, INCI), and price entries.
- Publish product events for Pricing, Inventory, Stand, CRM, and Marketing; prefetch competitor data and sharing insights with AI Brain.

## Inputs
- Source catalogs (Product Description, How to Use, USP templates, packaging master entries, regulatory docs).
- Admin edits for descriptions, statuses (`Active`, `Discontinued`), packaging, compliance attachments.
- AI insights (e.g., product narratives from AI Brain) and competitor analytics for contextual content.

## Outputs
- `BrandProduct` records and relation updates (`ProductPricing`, `CompetitorPrice`, `ProductPriceDraft`, `AIInsight`).
- Product documentation bundles (description, instructions, USP) consumed by Marketing, Commerce, and AI content factory.
- Events (`product.updated`, `product.assets.changed`) for Pricing, Inventory, Stand, and White Label OS.

## Internal Components
- `BrandProduct`, `BrandCategory`, `ProductPricing`, `CompetitorPrice`, `ProductPriceDraft`, `ProductMedia`, `PackagingDoc`, `ComplianceDoc`, `AIInsight` relations.
- Document store that persists `how-to-use`, `USP`, packaging templates referenced in marketing automation.
- Media manager for storing hero assets, packaging images, and supporting PDF docs.

## Required API Endpoints
- `GET /api/v1/product/list`, `POST /api/v1/product/create`, `PUT /api/v1/product/update/:id`, `DELETE /api/v1/product/delete/:id`.
- `GET /api/v1/product/details/:slug`, `GET /api/v1/product/categories`, `POST /api/v1/product/import`, `GET /api/v1/product/export`.
- AI: `POST /api/v1/product/ai/description`, `/product/ai/how-to-use`, `/product/ai/usp`, `/product/ai/content`.

## Required Data Models
- `BrandProduct`, `BrandCategory`, `ProductPricing`, `CompetitorPrice`, `ProductPriceDraft`, `AIPricingHistory`, `AILearningJournal`, `PackagingDoc`, `KnowledgeDocument`.

## Integration Notes
- Feeds Pricing OS for base costs, Inventory OS for stock snapshots, Marketing OS for catalogs, CRM OS for product mentions, Stand/Dealer for selection lists, White Label for product blueprints.
- Hooks to AI Brain to deliver product insights/AI-generated content; `Virtual Office` uses these insights to review product launches.
