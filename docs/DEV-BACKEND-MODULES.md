# Backend Module Status

## New skeletons
- `competitor` (see `apps/back-end/src/modules/competitor/[controller,service,routes,index,dto].ts`): handles placeholder scanning + pricing APIs with TODO responses so the module can be wired into the router tree without breaking builds.

## Verified modules
- `auth` already exposes controller → service → routes, so no new files were required to satisfy the minimal skeleton audit.
- `automation` ships with a rich service/router/controller stack, meaning a new module structure was already present in `apps/back-end/src/modules/automation`. The new router entry simply ensures the module is wired under `/api/v1/automation`.

## Files updated
1. `apps/back-end/src/modules/competitor/controller.ts`
2. `apps/back-end/src/modules/competitor/service.ts`
3. `apps/back-end/src/modules/competitor/routes.ts`
4. `apps/back-end/src/modules/competitor/dto.ts`
5. `apps/back-end/src/modules/competitor/index.ts`
6. `apps/back-end/src/app.ts`

## Next steps
1. Fill in `competitor.service` with real scanning connectors, map crawled data into `CompetitorPriceRecord`, and add validation in the DTOs.
2. Layer permissions/validators on the competitor routes when the feature starts handling real tenant data.
3. Continue documenting module behavior in `docs/MASTER_INDEX.md` so the router tree mirrors the live APIs.
