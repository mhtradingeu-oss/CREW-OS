# Partner Pricing Report

## Models Used

- `PartnerPricing` — stores partner/product price overrides with currency (schema: back-end/prisma/schema.prisma lines 1109–1122).
- `BrandProduct` — used to validate that a product belongs to the same brand and to expose `productName` in responses.
- `Partner` — ensures pricing rows are always parented by the correct brand via brand scoping.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/partners/:id/pricing` | Paginated list of pricing overrides for a partner, optionally filtered by product. |
| `POST` | `/api/v1/partners/:id/pricing/upsert` | Creates or updates a pricing record; the service enforces brand/product membership and fills missing currency from the brand. |

## Testing via Thunder Client

- Refer to `back-end/src/modules/partners/partners.pricing.http`.
- Configure the `apiUrl`, `bearerToken`, `brandId`, `partnerId`, and `productId` at the top.
- Run the list request before and after the upsert to confirm overrides persist.

## Integration Points

1. **Dealers / Pricing**: Overrides influence Dealer OS pricing displays; defaulting to `Brand.defaultCurrency` keeps margins aligned.
2. **Sales / Orders**: Sales orders reference `PartnerPricing` to ensure partner-specific net prices take precedence over base catalog pricing.
3. **Inventory & Finance**: Pricing overrides feed cost calculations used by Inventory reorders and Finance revenue tracking.
4. **AI Brain (future)**: Pricing overrides can be surfaced into Partner AI insights (Phase C) as the contextual data that AI summaries reference.

## Known Limitations

- No bulk upload or CSV import; pricing must be upserted individually per partner/product.
- There is no automated validation of conflicting currency values aside from defaulting to the brand's currency.
