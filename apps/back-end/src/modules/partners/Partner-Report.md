# Partner OS — Backend Report

## Models Used

- `Partner` (core entity, brand scoping, tier link, status flags)
- `PartnerTier` (tiers per brand that determine partner privileges)
- `PartnerOrder` / `PartnerOrderItem` (order history + product volume)
- `PartnerUser` (partner-to-platform user mapping)
- `StandPartner` (stand assignments per partner)
- `AffiliateLink` / `AffiliatePerformance` (affiliate metrics for the brand)
- `WhiteLabelOrder` (revenue belonging to white-label brands owned by the partner)

## Final Endpoints

- `GET /api/v1/partners`: paginated partner list (filters: brandId, tierId, status, search)
- `POST /api/v1/partners`: create a partner with normalized country/city, tier validation, uniqueness guards, and brand scope
- `GET /api/v1/partners/:id`: fetch a partner by id + brand scope
- `PUT /api/v1/partners/:id`: update partner metadata while honoring tier/brand
- `DELETE /api/v1/partners/:id`: soft-deactivate partner (`status = INACTIVE`)
- `GET /api/v1/partners/:id/stats`: aggregates orders, products, stands, affiliate links/revenue, white-label revenue, last order timestamp
- `GET /api/v1/partners/:id/users`: list partner users (paginated, brand scoped)
- `POST /api/v1/partners/:id/users`: attach an existing or newly created `User` to the partner (role validation)
- `PATCH /api/v1/partners/:id/users/:userId`: update the partner user role
- `DELETE /api/v1/partners/:id/users/:userId`: remove the partner user link

## Known Limitations

1. Affiliate stats aggregate by the partner’s brand (`AffiliateLink` / `AffiliatePerformance` filtered by `brandId`) because Prisma does not expose a direct `partnerId` on affiliates; a tighter relation can be introduced later.
2. Partner user creation currently requires either an existing `userId` or a new email/password pair; there is no automated invite workflow yet.
3. `partner.stats` is read-only and does not trigger downstream automations (automations/ai modules can subscribe to emitted events for future expansion).

## Testing via Thunder Client

Use `back-end/src/modules/partners/partners.http` and set the variables at the top (`apiUrl`, `authToken`, `brandId`). Run:

1. `List partners`, `Create partner`, `Get partner`, `Update partner`, `Deactivate partner`.
2. `Partner stats` to confirm aggregator values.
3. `List partner users`, `Create partner user`, `Update partner user`, and `Deactivate partner user`.

Ensure each request includes `Authorization: Bearer {{authToken}}` and the `brandId` query parameter for scoped endpoints.

## Integration with Other OS

1. **Dealers / Sales**: The partner list complements the Dealer OS by consolidating dealer, distributor, and salon data; events (`partners.created`, etc.) are published for the Automation/Activity Log stacks to respond.
2. **Stand Program**: `StandPartner` count is included in partner stats so stand stock/loyalty flows can reference the owning partner via `partnerId`.
3. **Affiliate OS**: Affiliate link/revenue metrics are surfaced per brand so affiliate partners (type = `affiliate`) appear in the Partner dashboard even though the affiliate module owns the original data.
4. **White Label OS**: White label brands owned by partners (`ownedWhiteLabels`) feed `WhiteLabelOrder` revenue summaries, highlighting how partners operate white-label storefronts.

## Phase A Deliverables

- Added fully scoped PartnerContract CRUD with direct termination/renewal support, documented via `Partner-Contract-Report.md` and exercisable with `partners.contracts.http`.
- Introduced PartnerPricing listing and upsert endpoints (brand/product validation, currency defaults) and captured the flow in `Partner-Pricing-Report.md` plus `partners.pricing.http`.
