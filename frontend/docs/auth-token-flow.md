# Authentication & Token Management

## Architecture overview

VoiceLink uses a **Next.js BFF (Backend For Frontend) cookie pattern** for secure token management. The NestJS backend stays stateless — tokens travel in response bodies and `Authorization` headers. Next.js API routes act as the cookie manager, converting between httpOnly cookies (browser ↔ Next.js) and Authorization headers (Next.js ↔ backend).

```
┌──────────┐     httpOnly cookies      ┌──────────┐    Authorization header    ┌──────────┐
│  Browser │ ◄──────────────────────── │ Next.js  │ ────────────────────────── │  NestJS  │
│          │                           │ (BFF)    │                            │ (API)    │
│ Zustand  │  POST /api/auth/login     │ proxy.ts │  POST /api/v1/auth/login   │ Prisma   │
│ (user)   │ ───────────────────────── │          │ ────────────────────────── │ JWT      │
└──────────┘                           └──────────┘                            └──────────┘
```

## Token storage

| Token | Browser | Server | Purpose |
|---|---|---|---|
| `access_token` | httpOnly cookie | NestJS JWT | API authentication (15 min TTL) |
| `refresh_token` | httpOnly cookie | DB-backed opaque token | Obtain new access tokens (30 day TTL) |
| `user` object | Zustand `persist` (localStorage) | — | UI state: name, email, role |

**httpOnly cookies** prevent XSS attacks from reading tokens. The `user` object in localStorage is non-sensitive (id, email) — stealing it does not grant API access.

## Login flow

```
1. User submits email + password
2. authStore.login() → POST /api/auth/login
3. Next.js route handler → proxyToBackend()
4. Proxy forwards to NestJS: POST /api/v1/auth/login {email, password}
5. NestJS validates credentials → returns { success, data: { user, accessToken, refreshToken, expiresIn } }
6. Proxy detects auth endpoint (/auth/login)
   → sets httpOnly cookie "access_token"   (path=/, maxAge=15min)
   → sets httpOnly cookie "refresh_token"  (path=/, maxAge=30d)
   → returns full response (tokens intact in JSON body)
7. authStore.login() reads response
   → setAuth(user, { accessToken, refreshToken })  // in-memory
   → user persisted via Zustand → localStorage
```

### Supported login methods

All follow the same cookie flow:

| Endpoint | Method |
|---|---|
| `POST /auth/login` | Email + password |
| `POST /auth/google` | Google OAuth ID token |
| `POST /auth/login/phone` | Phone OTP (action: verify) |
| `POST /auth/2fa/verify` | TOTP code + login token |

## API call flow (authenticated requests)

```
1. Component calls e.g. get("/conversations")
2. apiClient.get() → GET /api/conversations  (no Authorization header)
3. Next.js route handler → proxyToBackend("/conversations", { method: "GET" })
4. Proxy reads "access_token" cookie from browser request
   → sets Authorization: Bearer <token> header
5. Forward to NestJS: GET /api/v1/conversations (with Authorization header)
6. NestJS JWT strategy validates token → returns data
7. Proxy passes response through unchanged
```

**Key:** The browser never sends `Authorization` headers. The proxy translates cookies → headers. The frontend `apiClient` has no request interceptor — it's completely unaware of authentication.

## Token refresh flow

### Automatic (401 interceptor)

```
1. API call returns 401 (token expired)
2. apiClient response interceptor catches 401
3. Calls POST /api/auth/refresh {}
4. Proxy reads "refresh_token" cookie → injects into request body
5. Forward to NestJS: POST /api/v1/auth/refresh { refreshToken: "..." }
6. NestJS validates refresh token, rotates token family, returns new tokens
7. Proxy sets new httpOnly cookies (access_token + refresh_token)
8. Interceptor retries original request
9. All queued requests proceed with updated cookies
```

### Page refresh (user restored, tokens missing)

```
1. Browser loads page
2. Zustand persist rehydrates: user = { id, email, role }, isLoading = false
3. accessToken = null, refreshToken = null (not persisted)
4. DashboardLayout mount:
   → sees user exists, accessToken missing
   → calls refreshSession()
5. refreshSession() → POST /api/auth/refresh {}
6. Proxy reads "refresh_token" cookie → injects into body
7. Backend returns new tokens → proxy sets cookies
8. authStore.setTokens({ accessToken, refreshToken })
9. Dashboard renders with fresh tokens
```

### Refresh token security (rotation)

The backend implements token family rotation:
- Each refresh creates tokens with a `family` UUID
- If a revoked token is reused → entire family is revoked
- Users must re-login after revocation

## Logout flow

```
1. authStore.logout() → POST /api/auth/logout
2. Backend revokes refresh token in DB
3. authStore clears user + tokens from in-memory state
4. Browser redirected to /login
```

## WebSocket authentication

WebSocket uses Socket.IO which cannot send httpOnly cookies. A separate endpoint bridges the gap:

```
1. connectWebSocket() → POST /api/auth/ws-token
2. Proxy reads "access_token" cookie → sets Authorization header
3. NestJS ws-token endpoint returns short-lived JWT (5 min)
4. Socket.IO connects with: io("ws://localhost:4000/ws", { auth: { token } })
5. Backend DialerGateway/MessagingGateway verify JWT on connect
```

## File map

| File | Responsibility |
|---|---|
| `src/lib/proxy.ts` | Cookie manager — reads cookies → Authorization header, sets cookies from auth responses, injects refresh_token |
| `src/store/authStore.ts` | In-memory token cache + localStorage-persisted user |
| `src/lib/api.ts` | Axios instance, 401 interceptor with automatic refresh |
| `src/lib/websocket.ts` | Socket.IO connection with ws-token auth |
| `src/app/(dashboard)/layout.tsx` | Auth guard — redirects to /login if no user, triggers refresh on mount |
| `backend/src/auth/auth.controller.ts` | Login/refresh/logout/ws-token endpoints |
| `backend/src/auth/auth.service.ts` | Token generation (`issueTokens`), refresh rotation, credential validation |
| `backend/src/auth/strategies/jwt.strategy.ts` | JWT extraction from `Authorization: Bearer` header |
| `backend/src/auth/dto/refresh.dto.ts` | Refresh DTO (refreshToken optional — proxy injects from cookie) |

## Security properties

| Threat | Protection |
|---|---|
| XSS steals token | httpOnly cookies — JavaScript cannot read `access_token` or `refresh_token` |
| CSRF | `SameSite=lax` cookies + all mutations are POST |
| Token leaked in logs | Tokens never appear in URL query strings; only in initial JSON response body |
| Token replay | Refresh token rotation — each use revokes the previous token |
| Brute force login | Rate limited: 5 attempts per 15 minutes on login/register |
| Session hijack | Short-lived access tokens (15 min) limit exposure window |
