# Partner Contract Report

## Models Used

- `PartnerContract` — stores start/end with optional JSON terms and links back to `Partner` (schema: back-end/prisma/schema.prisma lines 1097–1106).
- `Partner` — enforces brand scope and tier relationships that the contract inherits.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/v1/partners/:id/contracts` | Paginated listing of a partner's contracts with optional `onlyActive` filter. |
| `GET` | `/api/v1/partners/:id/contracts/:contractId` | Fetch a single contract for the partner. |
| `POST` | `/api/v1/partners/:id/contracts` | Create a new contract with normalized terms JSON. |
| `PATCH` | `/api/v1/partners/:id/contracts/:contractId` | Update start/end dates and terms; reuses `terms` JSON. |
| `DELETE` | `/api/v1/partners/:id/contracts/:contractId` | Remove a contract after verifying brand ownership. |

## Testing via Thunder Client

- Use `back-end/src/modules/partners/partners.contracts.http`.
- Set the `apiUrl`, `bearerToken`, `brandId`, and partner/contract IDs at the top of the file.
- Run the list, get, create, update, and delete requests in sequence to ensure the service maintains brand scoping.

## Integration Points

1. **Dealers / Sales**: Contracts define terms for dealers/salons, so Sales/Dealers dashboards reference `PartnerContract` counts when gauging partner readiness.
2. **Stand Program**: Stand partners rely on valid contracts (start/end) before registering a `StandPartner`; the contract endpoints enforce brand ownership before linking stand assignments.
3. **WhiteLabel**: White-label partners (via `Partner.ownedWhiteLabels`) inherit contract settings for revenue-sharing calculations.
4. **Finance / Revenue**: Contract terms feed revenue recognition rules, so Order/Finance services can cross-reference contract dates during payouts.

## Known Limitations

- No approval workflow or multi-version tracking yet; contracts are deleted directly when removed.
- Terms are stored as free-form JSON, so there is no schema validation beyond Zod in this phase.
