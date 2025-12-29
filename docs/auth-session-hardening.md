# Auth Session Hardening (Phase 2)

The JWT payload is still the single source of truth for session identity (user id, role, tenant, brand),
but tokens are no longer returned to the browser in JSON or accessible via `window`/`document`.

## How the flow works now

1. `POST /api/v1/auth/login` and `POST /api/v1/auth/register` return only the session payload
   (user/tenant/brand/plan) in the JSON body.
2. The backend issues a `mh_os_session` cookie with `HttpOnly`, `Secure`, `SameSite=Lax`, and a
   7‑day TTL. The cookie is attached to both browser and server‑side requests as long as the caller
   forwards cookies.
3. `GET /api/v1/auth/me` re-validates the cookie, refreshes the session data, and re-issues the cookie.
4. `POST /api/v1/auth/logout` clears the cookie regardless of client state.

Because the browser cannot read or write the token, client code simply calls the API and relies on
the backend to manage the cookie lifecycle.

## Security Guarantees

- **XSS resistance** – Even if an attacker executes arbitrary JS, they cannot steal the JWT because
  it is never exposed outside of an HttpOnly cookie.
- **Session leak prevention** – Token logging and storage in local/session storage were removed, so
  tokens are not dumped into consoles, Redux stores, or telemetry.
- **SSR compatibility** – Use the new `serverApi` helper (`@/lib/api/server`) inside server
  components or route handlers. It automatically forwards the `mh_os_session` cookie so requests
  authenticate without touching the DOM or local storage.
- **Tenant context preserved** – JWT payloads still include tenant/brand identifiers and the session
  JSON continues to ship tenant/brand/plan data for UI gating.

When adding new API calls from server-side code, be sure to forward the `mh_os_session` cookie in
the request headers so that the backend can authenticate the call.
