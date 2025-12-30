# AI Read-Only Snapshot (Phase D Hard Freeze)

## Overview
- Pipeline: `aiReadOnlySnapshotService` builds the Phase D snapshot via `buildAIReadOnlySnapshot`. It runs inside `runReadOnlySnapshot`, activating the Prisma middleware guard so any mutation attempt throws `AI_READ_ONLY_MUTATION`.
- Endpoint: `GET /api/v1/ai/read-only/snapshot` (mounted under `/api/v1/ai`) and guarded by both `ai:read` and `ai:insights:read`.
- Feature flag: `AI_READ_ONLY_ENABLED` defaults to `false`; the endpoint fails closed with a 503 if the toggle is off, so every environment explicitly acknowledges the state before Phase D can be considered closed.
- Environment note: production/staging must set `AI_READ_ONLY_ENABLED=true` explicitly and respect the same `env.NODE_ENV` mention in the error message/log generated when disabled. Development can flip the flag for iterative testing.

## Determinism & Bounds
- Snapshot content is derived from deterministic hashes (`hashObject`) seeded by `brandId`, `NODE_ENV`, and a fixed five-minute window (`AI_READ_ONLY_WINDOW_MINUTES`). Replaying with the same inputs yields the same `snapshotHash`, `generatedAt`, and event/metric arrays.
- `aiReadOnlySnapshotService` enforces bounds before caching:
  - **Timeout** (`AI_READ_ONLY_TIMEOUT_MS`): the generation promise races against a timeout promise; timeouts throw `AI_READ_ONLY_TIMEOUT`.
  - **Max rows** (`AI_READ_ONLY_MAX_ROWS`): the number of entries in `events.moduleBreakdown` must stay within the configured limit, otherwise the request fails with `AI_READ_ONLY_ROW_LIMIT`.
  - **Max payload size** (`AI_READ_ONLY_MAX_PAYLOAD_BYTES`): the serialized snapshot must fit under the configured byte limit or it fails with `AI_READ_ONLY_PAYLOAD_LIMIT`.
- Caching uses deterministic keys (`brandId` + `NODE_ENV` + window) so repeated hits return the same prebuilt snapshot while still respecting the bounds/timeout guard.

## Logging & Privacy
- Logs never contain snapshot content or sensitive user data. The snapshot service logs only metadata: `snapshotHash`, `brandHash` (a hash of the optional `brandId`), `aiWindowMinutes`, `cacheHit`, `durationMs`, and the `correlationId` supplied by the middleware.
- The Prisma middleware guard logs as part of normal DB instrumentation but throws immediately before any mutation executes, preventing writes.

## Feature Flags & RBAC
- The feature flag table:

  | Variable | Description | Default |
  | --- | --- | --- |
  | `AI_READ_ONLY_ENABLED` | Enables the Phase D snapshot service. Must be `true` in environments that need Phase D behavior; otherwise all requests respond with 503. | `false` |
  | `AI_READ_ONLY_TIMEOUT_MS` | Time in milliseconds before snapshot generation fails closed. | `5000` |
  | `AI_READ_ONLY_CACHE_TTL_MS` | How long (ms) cached snapshots stay alive before they are recomputed. | `120000` |
  | `AI_READ_ONLY_MAX_ROWS` | Maximum allowed rows for `events.moduleBreakdown`. | `50` |
  | `AI_READ_ONLY_MAX_PAYLOAD_BYTES` | Maximum serialized snapshot size in bytes. | `131072` |

- RBAC: the controller requires both `ai:read` and `ai:insights:read`. Super-admins bypass the check as usual.
- The endpoint respects the `correlationId` set by the HTTP middleware and includes it in logs for traceability.

## Testing Coverage
- Unit tests cover:
  1. The Prisma guard (`runReadOnlySnapshot` + `enforceReadOnlyMutation`) to ensure any mutation call fails in Phase D.
  2. Deterministic snapshot generation (`buildAIReadOnlySnapshot`) returning identical hashes and module breakdowns for the same inputs.
  3. Bounds enforcement in `aiReadOnlySnapshotService` (row and payload limits cause the request to reject).
  4. Timeout enforcement (`AI_READ_ONLY_TIMEOUT_MS`) which rejects if generation exceeds the configured window.

## Failure Policy
- The service fails closed on any guard violation, timeout, or bound breach. The response always omits snapshot contents; only the error code/message and metadata are returned.

## Endpoint Summary
- `GET /api/v1/ai/read-only/snapshot`
  - Guards: `ai:read`, `ai:insights:read`
  - Feature flag: `AI_READ_ONLY_ENABLED` (default `OFF`)
  - Query: optional `brandId`
  - Response: deterministic `AIReadOnlySnapshot` structure plus metadata; snapshot is cached per deterministic key.
