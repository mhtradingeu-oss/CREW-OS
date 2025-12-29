# Auth Phase 3 Verification

## Expected curl flow

1. **Get CSRF token:**

```
curl -c cookies.txt http://localhost:4000/api/v1/auth/csrf
```
- Response: 200 OK
- Sets `mh_os_csrf` cookie

2. **Login:**

```
curl -b cookies.txt -c cookies.txt \
  -H "X-CSRF-Token: <value>" \
  -X POST http://localhost:4000/api/v1/auth/login \
  -d '{"email":"user@example.com","password":"password"}' 
```
- Response: 200 OK
- Sets `mh_os_session` cookie (HttpOnly)
- No JWT/token in JSON response

3. **Access protected route:**

```
curl -b cookies.txt \
  -H "X-CSRF-Token: <value>" \
  -X POST http://localhost:4000/api/v1/brand
```
- Response: 200 OK

## Expected cookies
- `mh_os_csrf`: present after /csrf
- `mh_os_session`: present after /login

## Expected HTTP codes
- 200 OK for all successful requests
- 401/403 for unauthorized/forbidden

## Security notes
- No tokens ever leave the server in JSON
- All session cookies are HttpOnly, Secure (in production), SameSite=Lax
- CSRF protection enforced on all unsafe methods
- SSR-safe: no Authorization headers used

## Route invariants
- `/api/v1/auth/csrf`: public GET
- `/api/v1/auth/login` & `/register`: require CSRF, do NOT require session
- `/api/v1/auth/logout`: requires session, clears session cookie
- All non-auth routes: require CSRF + session

---

**Auth Phase 3: COMPLETE**
