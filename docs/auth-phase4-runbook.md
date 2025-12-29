# Auth Phase 4 Runbook

## 1. Login Success/Fail Events

### Success:
```
curl -c cookies.txt -b cookies.txt -H "X-CSRF-Token: <token>" -X POST http://localhost:4000/api/v1/auth/login -d '{"email":"user@example.com","password":"password"}' -H "Content-Type: application/json"
# Expect: 200 OK, [security-event] AUTH_LOGIN_SUCCESS in logs
```

### Fail:
```
curl -c cookies.txt -b cookies.txt -H "X-CSRF-Token: <token>" -X POST http://localhost:4000/api/v1/auth/login -d '{"email":"user@example.com","password":"wrong"}' -H "Content-Type: application/json"
# Expect: 401, [security-event] AUTH_LOGIN_FAILED in logs (emailHash only)
```

## 2. CSRF Invalid
```
curl -c cookies.txt -b cookies.txt -X POST http://localhost:4000/api/v1/auth/login -d '{"email":"user@example.com","password":"password"}' -H "Content-Type: application/json"
# Expect: 403, [security-event] CSRF_INVALID in logs
```

## 3. Rate Limited
```
# Run login fail 11+ times in 15min from same IP
# Expect: 429, [security-event] RATE_LIMITED in logs
```

## 4. Cookie Tamper
```
sed -i '' 's/mh_os_session=.*/mh_os_session=invalid/' cookies.txt
curl -b cookies.txt -H "X-CSRF-Token: <token>" http://localhost:4000/api/v1/brand
# Expect: 401, [security-event] SESSION_INVALID in logs
```

---

- All events must redact secrets (no raw email, password, token, cookie, or headers)
- All error messages must be generic (no user enumeration)
- Run `npm run typecheck` and `npm run lint` before PR
