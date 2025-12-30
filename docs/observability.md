# Observability Contract (Phase C)

## Logging guarantees
- Every log entry is emitted as a single JSON object with the stable fields `timestamp`, `level`, `service`, `env`, `correlationId`, `route`, `status`, and `durationMs`. That ensures downstream systems can rely on a predictable schema regardless of the caller.
- The `service` field derives from `SERVICE_NAME` (defaults to `crewos-back-end`) and `env` follows `NODE_ENV` (default `development`).
- The request logging middleware emits `request.start`/`request.end` events with sanitized routes (`/api/v1/auth/*` for authentication flows) and the duration/status captured once the response finishes. These entries never include the request body, authorization headers, cookies, or other secret material.
- Correlation IDs are seeded at the earliest middleware (`correlationIdMiddleware`) and then re-used by every log path (including the `/metrics` handler) so that a single trace ID flows through the request lifecycle.
- Error logs always capture the error `name` and `message`; the stack trace is only included in non-production environments to avoid leaking internal details.

## Metrics endpoint
- `/metrics` responds in Prometheus text format when `METRICS_ENABLED !== "false"` and returns 404 otherwise. It sets the correct `Content-Type` header and never lets `prom-client` errors bubble up.
- The Prom client registry publishes the HTTP request counters/histograms (`http_requests_total`, `http_request_duration_ms`), process-level metrics (`process_uptime_seconds`, `process_resident_memory_bytes`), and event-loop lag metrics (`nodejs_eventloop_lag_seconds`, related buckets). Event-loop monitoring precision is configurable via `METRICS_EVENT_LOOP_PRECISION_MS` (defaults to `100`).
- When metric collection fails, the handler logs the failure (with its own correlation ID if available) and returns a small fallback metric (`crewos_metrics_collection_error`) instead of propagating the exception.
- `httpMetricsMiddleware` records the sanitized route for each request so that both logs and Prometheus labels use the same route normalization.

## Tests and verification
- Unit tests cover the logger schema (`logger.fields.unit.test.ts`), ensure stack traces are gated by `NODE_ENV`, and guard against logging bodies or secret headers inside `requestLogger`.
- The `/metrics` endpoint tests validate the happy path, the disabled state, and the fallback behaviour when `register.metrics()` rejects.

Keep this document in sync with `apps/back-end/src/core/logger.ts`, `apps/back-end/src/core/http/middleware/request-logger.ts`, and `apps/back-end/src/core/metrics/*.ts`.
