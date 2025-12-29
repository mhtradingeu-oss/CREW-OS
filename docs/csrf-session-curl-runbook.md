## CSRF + Session Auth Curl Runbook (MH-OS Superapp)

### 1. Get CSRF Token (public, sets mh_os_csrf cookie)
```sh
curl -i -c cookies.txt \
  http://localhost:4000/api/v1/auth/csrf
```

### 2. Login (send X-CSRF-Token header and mh_os_csrf cookie)
```sh
CSRF=$(grep mh_os_csrf cookies.txt | awk '{print $7}')
curl -i -b cookies.txt -c cookies.txt \
  -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:4000/api/v1/auth/login \
  -d '{"email":"user@example.com","password":"password"}'
```

### 3. POST /api/v1/brand without CSRF (should fail with 403 CSRF_INVALID)
```sh
curl -i -b cookies.txt -c cookies.txt \
  -H "Content-Type: application/json" \
  -X POST http://localhost:4000/api/v1/brand \
  -d '{"name":"Test Brand"}'
```

### 4. POST /api/v1/brand with CSRF + session (should succeed)
```sh
CSRF=$(grep mh_os_csrf cookies.txt | awk '{print $7}')
curl -i -b cookies.txt -c cookies.txt \
  -H "X-CSRF-Token: $CSRF" \
  -H "Content-Type: application/json" \
  -X POST http://localhost:4000/api/v1/brand \
  -d '{"name":"Test Brand"}'
```