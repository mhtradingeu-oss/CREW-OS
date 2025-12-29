# Correlation ID Propagation Flow

## 1. HTTP Layer
- The `correlationIdMiddleware` reads the `x-correlation-id` header from incoming requests.
- If not present, it generates a new UUID.
- The correlation ID is attached to `req.context.correlationId` for the lifetime of the request.

## 2. Event Layer
- When `publish()` is called in the event bus, it ensures every `EventEnvelope.context` includes a `correlationId`.
- If not provided, it tries to use `req.context.correlationId` (if available), or generates a new one.
- The correlation ID is also set as `requestId` for backward compatibility.

## 3. Logging
- The logger automatically includes the correlation ID in all log entries, if available.
- It checks (in order):
  - The `meta` argument (if it contains `correlationId` or `requestId`)
  - The global `req.context.correlationId` (if running in an HTTP request)
- Log output is prefixed with `[cid:<correlationId>]` when available.

## End-to-End Trace
- A correlation ID is generated or propagated from the HTTP request.
- It is attached to all events and logs produced during the request lifecycle.
- This enables tracing a request across HTTP, event, and log boundaries for observability and debugging.
