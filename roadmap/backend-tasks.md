# VoiceLink NestJS Backend — Complete Task List

> **Derived from:** SDD §3, SRS §3–8, PAL §1–12, URD Use Cases, API Reference
> **Stack:** NestJS 10 · Prisma ORM · PostgreSQL 15 · Redis 7 · Twilio SDK (v1)
> **Current state:** Fresh scaffold (`AppController.getHello()` only)
> **Target:** Complete production-ready API gateway
>
> **⚠️ Power Dialer Engine:** The actual dialing engine is a separate **Go Echo microservice**. Its complete task list lives in **[roadmap/dialer-tasks.md](roadmap/dialer-tasks.md)**. This file covers only the NestJS-side dialer proxy (Phase 8) that manages campaigns and communicates with the Go service via internal HTTP.

---

## Best-Practice Folder Structure (Target)

```
/backend
├── src/
│   ├── main.ts                          # Bootstrap, global pipes/filters/interceptors
│   ├── app.module.ts                    # Root module — wire all feature modules
│   │
│   ├── common/                          # Shared layer — zero feature dependencies
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts     # @CurrentUser() — extract req.user
│   │   │   ├── roles.decorator.ts            # @Roles('admin')
│   │   │   └── public.decorator.ts           # @Public() — skip JWT auth
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts      # Global error → { success, error }
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts             # Global JWT guard (respects @Public)
│   │   │   ├── roles.guard.ts                # Role-based access control
│   │   │   └── api-key.guard.ts              # API key auth for Persona 4
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts      # Wrap 2xx in { success, data }
│   │   │   ├── logging.interceptor.ts        # Log every request with duration
│   │   │   └── request-id.interceptor.ts     # X-Request-ID propagation
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts            # Global ValidationPipe config
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts
│   │   └── types/
│   │       └── express.d.ts                  # Extend Express Request with user
│   │
│   ├── config/                          # Configuration module — env vars → typed config
│   │   ├── config.module.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── jwt.config.ts
│   │   ├── telephony.config.ts
│   │   └── app.config.ts
│   │
│   ├── prisma/                          # Database layer
│   │   ├── prisma.module.ts             # Global module — exports PrismaService
│   │   ├── prisma.service.ts            # onModuleInit connect, onModuleDestroy disconnect
│   │   └── prisma.utils.ts              # Transaction helper, pagination helper
│   │
│   ├── auth/                            # Authentication & authorization
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── google.strategy.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       ├── refresh.dto.ts
│   │       ├── forgot-password.dto.ts
│   │       ├── reset-password.dto.ts
│   │       ├── phone-otp.dto.ts
│   │       └── verify-2fa.dto.ts
│   │
│   ├── telephony/                       # Provider Abstraction Layer
│   │   ├── telephony.module.ts          # Provider factory + global export
│   │   ├── interfaces/
│   │   │   └── telephony-provider.interface.ts
│   │   ├── providers/
│   │   │   ├── twilio.provider.ts       # Active implementation
│   │   │   ├── vonage.provider.ts       # Stub
│   │   │   ├── bandwidth.provider.ts    # Stub
│   │   │   ├── plivo.provider.ts        # Stub
│   │   │   └── telnyx.provider.ts       # Stub
│   │   ├── status-maps/
│   │   │   ├── twilio.json
│   │   │   ├── vonage.json
│   │   │   └── bandwidth.json
│   │   └── guards/
│   │       └── webhook-signature.guard.ts
│   │
│   ├── numbers/                         # Virtual number management
│   │   ├── numbers.module.ts
│   │   ├── numbers.controller.ts
│   │   ├── numbers.service.ts
│   │   └── dto/
│   │       ├── search-numbers.dto.ts
│   │       └── provision-number.dto.ts
│   │
│   ├── messaging/                       # SMS/MMS messaging
│   │   ├── messaging.module.ts
│   │   ├── messaging.controller.ts      # REST: conversations, messages
│   │   ├── messaging.service.ts
│   │   ├── messaging.gateway.ts         # WebSocket: message:new, message:status
│   │   ├── webhooks/
│   │   │   └── sms-webhook.controller.ts
│   │   └── dto/
│   │       ├── send-message.dto.ts
│   │       └── query-messages.dto.ts
│   │
│   ├── calling/                         # VoIP calling
│   │   ├── calling.module.ts
│   │   ├── calling.controller.ts        # REST: calls, voicemails, token
│   │   ├── calling.service.ts
│   │   ├── calling.gateway.ts           # WebSocket: call:inbound, call:status
│   │   ├── webhooks/
│   │   │   └── voice-webhook.controller.ts
│   │   └── dto/
│   │       └── call-query.dto.ts
│   │
│   ├── dialer/                          # Power dialer — NestJS proxy to Go service
│   │   ├── dialer.module.ts
│   │   ├── dialer.controller.ts         # REST: campaign CRUD → Go
│   │   ├── dialer.service.ts            # HTTP client to Go dialer-service
│   │   ├── dialer.gateway.ts            # WebSocket: campaign:progress, campaign:complete
│   │   ├── csv-validator.ts             # Pre-upload CSV validation
│   │   ├── dto/
│   │   │   ├── create-campaign.dto.ts
│   │   │   └── campaign-query.dto.ts
│   │   └── internal/                    # Internal endpoints (called by Go)
│   │       └── dialer-callback.controller.ts
│   │
│   ├── contacts/                        # Contact management
│   │   ├── contacts.module.ts
│   │   ├── contacts.controller.ts
│   │   ├── contacts.service.ts
│   │   └── dto/
│   │       ├── create-contact.dto.ts
│   │       └── update-contact.dto.ts
│   │
│   ├── billing/                         # Stripe billing & usage tracking
│   │   ├── billing.module.ts
│   │   ├── billing.controller.ts
│   │   ├── billing.service.ts
│   │   ├── usage-tracker.service.ts
│   │   ├── webhooks/
│   │   │   └── stripe-webhook.controller.ts
│   │   └── dto/
│   │       └── upgrade-plan.dto.ts
│   │
│   ├── templates/                       # Message templates
│   │   ├── templates.module.ts
│   │   ├── templates.controller.ts
│   │   ├── templates.service.ts
│   │   └── dto/
│   │       └── template.dto.ts
│   │
│   ├── api-keys/                        # API key management (Persona 4)
│   │   ├── api-keys.module.ts
│   │   ├── api-keys.controller.ts
│   │   └── api-keys.service.ts
│   │
│   ├── audit/                           # Audit logging
│   │   ├── audit.module.ts
│   │   ├── audit.service.ts
│   │   └── audit.controller.ts          # Admin-only: GET /admin/audit-logs
│   │
│   ├── jobs/                            # Scheduled jobs (cron)
│   │   ├── jobs.module.ts
│   │   ├── number-grace-period.job.ts
│   │   ├── usage-alert.job.ts
│   │   ├── invoice-generation.job.ts
│   │   ├── data-retention.job.ts
│   │   ├── token-cleanup.job.ts
│   │   └── scheduled-message.job.ts
│   │
│   └── health/                          # Health check
│       ├── health.module.ts
│       └── health.controller.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                          # Seed plans + dev data
│
├── test/
│   ├── unit/
│   ├── e2e/
│   └── fixtures/
│       └── valid-contacts.csv
│
├── Dockerfile
├── .env.example
├── nest-cli.json
├── tsconfig.json
└── package.json
```

### NestJS Best Practices Applied

| Principle | Implementation |
|---|---|
| **Module encapsulation** | Each feature is a self-contained module — controller, service, DTOs, tests live together |
| **Global providers** | `PrismaService`, `ConfigService`, `TELEPHONY_PROVIDER` are globally available via `@Global()` modules |
| **Controller ≤ Service ≤ Repository** | Controllers are thin (bind/validate/delegate). Services hold business logic. Prisma is the repository layer. |
| **DTOs per endpoint** | Each endpoint gets dedicated DTO with `class-validator` decorators — not one DTO reused across endpoints |
| **Pipes for validation** | Global `ValidationPipe` with `whitelist: true, transform: true` — no manual validation in controllers |
| **Guards for auth** | `JwtAuthGuard` is global (registered in `APP_GUARD`). `@Public()` decorator exempts specific routes. |
| **Interceptors for cross-cutting** | Response transform, logging, request ID — registered globally, no per-controller boilerplate |
| **Filters for errors** | Single global exception filter maps all exceptions to `{ success: false, error: { code, message } }` |
| **Repository pattern** | Prisma is abstracted behind `PrismaService` — services never import `@prisma/client` directly |
| **Environment config** | All config via `ConfigModule` with typed `registerAs()` — no `process.env` outside config files |
| **WebSocket separation** | Gateways live in their feature module but only emit events — services call `gateway.emit*()` methods |
| **Internal API auth** | Go service → NestJS callbacks authenticated via shared `INTERNAL_API_KEY`, not JWT |

---

## Phase 0 — Project Foundation

### 0.1 — Dependencies & Configuration

- [ ] **0.1.1** Install core NestJS packages: `@nestjs/config`, `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/websockets`, `@nestjs/platform-socket.io`, `@nestjs/swagger`, `@nestjs/throttler`, `@nestjs/schedule`, `@nestjs/event-emitter`
- [ ] **0.1.2** Install database: `@prisma/client`, `prisma` (dev)
- [ ] **0.1.3** Install authentication: `passport`, `passport-jwt`, `passport-google-oauth20`, `bcrypt`, `speakeasy` (TOTP), `qrcode`
- [ ] **0.1.4** Install Redis: `ioredis`, `@nestjs/bullmq`, `bullmq`
- [ ] **0.1.5** Install integrations: `twilio` (v1 active), `stripe`, `@sendgrid/mail`, `@aws-sdk/client-s3`, `openai` (Whisper STT fallback)
- [ ] **0.1.6** Install utilities: `class-validator`, `class-transformer`, `axios`, `multer` (CSV upload), `csv-parse`, `e164` (phone validation)

**Refs:** SDD §3.1, SDD §8.3

### 0.2 — Environment & Config

- [ ] **0.2.1** Create `src/config/database.config.ts` — load `DATABASE_URL` from env
- [ ] **0.2.2** Create `src/config/redis.config.ts` — load `REDIS_URL` from env
- [ ] **0.2.3** Create `src/config/telephony.config.ts` — load `TELEPHONY_PROVIDER` + per-provider credentials
- [ ] **0.2.4** Wire all config modules into `AppModule` via `ConfigModule.forRoot({ isGlobal: true })`
- [ ] **0.2.5** Create `.env.example` with all variables from SDD §8.3

**Refs:** SDD §3.1 (config/), SDD §8.3, PAL §4.1

### 0.3 — Prisma Setup

- [ ] **0.3.1** Write `prisma/schema.prisma` with all 22 tables from `roadmap/database-schema.md`
- [ ] **0.3.2** Map `provider` columns with `@default("twilio")` per PAL §7
- [ ] **0.3.3** Map `capabilities` as `Json` type
- [ ] **0.3.4** Map `tags` and `media_urls` as `String[]` (PostgreSQL text arrays)
- [ ] **0.3.5** Run `npx prisma migrate dev --name init` — create initial migration
- [ ] **0.3.6** Create `src/prisma/prisma.module.ts` and `PrismaService` with `onModuleInit` / `onModuleDestroy`
- [ ] **0.3.7** Add seed script: create Free/Pro/Business plans in `plans` table

**Refs:** SDD §5.1, SDD §5.2, PAL §7, `roadmap/database-schema.md`

---

## Phase 1 — Common Layer (All Modules Depend On This)

### 1.1 — Exception Handling

- [ ] **1.1.1** Create `src/common/filters/http-exception.filter.ts` — catch all exceptions, return `{ success: false, error: { code, message, field? } }` per API §Error Codes
- [ ] **1.1.2** Register as global filter in `main.ts`

**Refs:** SDD §3.1 (common/filters/), API §10.1 (error response envelope), API §Error Codes

### 1.2 — Response Transform

- [ ] **1.2.1** Create `src/common/interceptors/transform.interceptor.ts` — wrap all 2xx responses in `{ success: true, data }`, unwrap paginated responses to `{ success: true, data, meta }`
- [ ] **1.2.2** Register as global interceptor in `main.ts`

**Refs:** SDD §3.1 (common/interceptors/), API §10.1 (response envelope)

### 1.3 — Logging

- [ ] **1.3.1** Create `src/common/interceptors/logging.interceptor.ts` — log every request: method, URL, userId, duration, status code
- [ ] **1.3.2** Register as global interceptor

**Refs:** SDD §3.1 (common/interceptors/)

### 1.4 — Validation

- [ ] **1.4.1** Create `src/common/pipes/validation.pipe.ts` — global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true, transform: true`
- [ ] **1.4.2** Register as global pipe in `main.ts`

**Refs:** SDD §3.1 (common/pipes/)

### 1.5 — Decorators

- [ ] **1.5.1** Create `src/common/decorators/current-user.decorator.ts` — `@CurrentUser()` param decorator extracting `req.user` (typed)
- [ ] **1.5.2** Create `src/common/decorators/roles.decorator.ts` — `@Roles('admin')` decorator

**Refs:** SDD §3.1 (common/decorators/)

### 1.6 — Rate Limiting

- [ ] **1.6.1** Import `ThrottlerModule` globally with Redis-backed storage
- [ ] **1.6.2** Configure login-specific guard: 5 attempts per 15 min per IP (FR-AUTH-07)
- [ ] **1.6.3** Configure general guards: 100 req/min for authenticated users, 20 req/min unauthenticated

**Refs:** FR-AUTH-07, SRS §7

---

## Phase 2 — Telephony PAL (Foundation Before Calling/Messaging/Numbers)

> **Blocking note:** Calling, Messaging, and Numbers modules all depend on `TELEPHONY_PROVIDER`. Build this first.

### 2.1 — Interface Definition

- [ ] **2.1.1** Create `src/telephony/interfaces/telephony-provider.interface.ts` — exact `TelephonyProvider` interface from PAL §3 including all methods: `searchAvailableNumbers`, `provisionNumber`, `releaseNumber`, `configureNumberWebhooks`, `sendMessage`, `generateClientToken`, `initiateOutboundCall`, `generateCallControlResponse`, `validateWebhookSignature`, `parseInboundMessageWebhook`, `parseInboundCallWebhook`, `parseStatusCallback`, `getRecording`, `transcribeRecording?`
- [ ] **2.1.2** Define `ProviderCapabilities` interface
- [ ] **2.1.3** Define normalized event shapes: `NormalizedInboundMessage`, `NormalizedInboundCall`, `NormalizedStatusEvent`
- [ ] **2.1.4** Define `NumberSearchParams`, `SendMessageParams`, `OutboundCallParams`, `WebhookConfig`, `CallControlAction`

**Refs:** PAL §3, PAL §3.1

### 2.2 — Twilio Provider (Active Implementation)

- [ ] **2.2.1** Create `src/telephony/providers/twilio.provider.ts` — implement every `TelephonyProvider` method using Twilio SDK
- [ ] **2.2.2** Implement `searchAvailableNumbers` — call `client.availablePhoneNumbers('US').local.list({ areaCode, ... })`
- [ ] **2.2.3** Implement `provisionNumber` — call `client.incomingPhoneNumbers.create({ phoneNumber })`, store webhook URLs with `:provider` path prefix
- [ ] **2.2.4** Implement `releaseNumber` — call `client.incomingPhoneNumbers(providerSid).remove()`
- [ ] **2.2.5** Implement `configureNumberWebhooks` — update voice/sms webhook URLs on provisioned number
- [ ] **2.2.6** Implement `sendMessage` — call `client.messages.create({ from, to, body, mediaUrl })`, return `{ providerSid, status }`
- [ ] **2.2.7** Implement `generateClientToken` — create Twilio `AccessToken` with VoiceGrant, 55-min expiry (SDD §9)
- [ ] **2.2.8** Implement `initiateOutboundCall` — TwiML or API-initiated outbound call to client's WebRTC identity
- [ ] **2.2.9** Implement `generateCallControlResponse` — produce TwiML string from `CallControlAction`
- [ ] **2.2.10** Implement `validateWebhookSignature` — verify Twilio X-Twilio-Signature header using auth token
- [ ] **2.2.11** Implement `parseInboundMessageWebhook` — extract `From`, `To`, `Body`, `MessageSid`, `NumMedia`, `MediaUrlN` → `NormalizedInboundMessage`
- [ ] **2.2.12** Implement `parseInboundCallWebhook` — extract `CallSid`, `From`, `To`, `Direction` → `NormalizedInboundCall`
- [ ] **2.2.13** Implement `parseStatusCallback` — map Twilio status strings to VoiceLink enums using `status-maps/twilio.json`
- [ ] **2.2.14** Implement `getRecording` — fetch recording media URL
- [ ] **2.2.15** Implement `transcribeRecording` — use Twilio's built-in transcription API
- [ ] **2.2.16** Set `capabilities` field per PAL §10 capability matrix

**Refs:** PAL §3, PAL §6 (status maps), PAL §10 (capabilities), SDD §2.3 (WebRTC token)

### 2.3 — Stub Providers

- [ ] **2.3.1** Create `src/telephony/providers/vonage.provider.ts` — implement interface, every method throws `NotImplementedException`
- [ ] **2.3.2** Create `src/telephony/providers/bandwidth.provider.ts` — same stub pattern
- [ ] **2.3.3** Create `src/telephony/providers/plivo.provider.ts` — same stub pattern
- [ ] **2.3.4** Create `src/telephony/providers/telnyx.provider.ts` — same stub pattern

**Refs:** PAL §11 (Phase 1 — stubs), SDD §3.1 (telephony/providers/)

### 2.4 — Status Maps (JSON)

- [ ] **2.4.1** Create `src/telephony/status-maps/twilio.json` — message & call status mappings per PAL §6
- [ ] **2.4.2** Create `src/telephony/status-maps/vonage.json`
- [ ] **2.4.3** Create `src/telephony/status-maps/bandwidth.json`

**Refs:** PAL §6.1, PAL §6.2

### 2.5 — Telephony Module (DI Registry)

- [ ] **2.5.1** Create `src/telephony/telephony.module.ts` — provider factory via `useFactory` reading `TELEPHONY_PROVIDER` env var (PAL §4.2)
- [ ] **2.5.2** Inject `ConfigService` into factory
- [ ] **2.5.3** Export `TELEPHONY_PROVIDER` token globally

**Refs:** PAL §4.2, SDD §3.1 (telephony/)

### 2.6 — Webhook Signature Guard

- [ ] **2.6.1** Create `src/telephony/guards/webhook-signature.guard.ts` — guard that extracts `:provider` param, calls `provider.validateWebhookSignature(req)`, throws 403 on failure

**Refs:** SDD §3.4, PAL §5, SRS SR-05

---

## Phase 3 — Auth Module

### 3.1 — JWT Strategy & Guards

- [ ] **3.1.1** Create `src/auth/strategies/jwt.strategy.ts` — `PassportStrategy(Strategy)` extracting from `Authorization: Bearer <token>`, validate against DB, return user object (FR-AUTH-05)
- [ ] **3.1.2** Create `src/auth/guards/jwt-auth.guard.ts` — `AuthGuard('jwt')` wrapper
- [ ] **3.1.3** Create `src/auth/guards/roles.guard.ts` — check user role from `@Roles()` decorator
- [ ] **3.1.4** Register JWT secret (`JWT_ACCESS_SECRET`) and expiry (15 min) in config (FR-AUTH-05)

**Refs:** SDD §3.1 (auth/strategies/, auth/guards/), FR-AUTH-05

### 3.2 — Auth Service

- [ ] **3.2.1** Create `src/auth/auth.service.ts`
- [ ] **3.2.2** Implement `register(dto)` — validate password strength (min 8 chars, 1 number, 1 special per FR-AUTH-02), hash with bcrypt cost 12 (SR-01), insert user, generate `email_verification_token` (crypto random), store hashed in `email_verification_tokens` table, send email via SendGrid, return user (FR-AUTH-01, FR-AUTH-03)
- [ ] **3.2.3** Implement `verifyEmail(token)` — lookup token in `email_verification_tokens`, check expiry, mark `users.email_verified = true` (US-002, FR-AUTH-03)
- [ ] **3.2.4** Implement `login(dto)` — find user by email, compare bcrypt, check rate limit (FR-AUTH-07), if TOTP enabled return `loginToken` for 2FA step, else generate JWT access token + refresh token (FR-AUTH-05, FR-AUTH-08)
- [ ] **3.2.5** Implement `loginPhoneOtp(dto)` — `action: 'request'` → generate 6-digit code, hash + store in `otp_codes`, send via Twilio SMS through PAL; `action: 'verify'` → check attempts < 5, compare hash, issue tokens (FR-AUTH-04)
- [ ] **3.2.6** Implement `googleLogin(idToken)` — verify Google idToken via `google-auth-library`, find or create user by `google_id`, issue tokens (FR-AUTH-06)
- [ ] **3.2.7** Implement `logout(refreshToken)` — hash token, revoke in `refresh_tokens` table (FR-AUTH-10)
- [ ] **3.2.8** Implement `refresh(refreshToken)` — hash token, find in `refresh_tokens`, check not revoked/expired, detect rotation (reuse = revoke family), issue new access + refresh token, rotate (FR-AUTH-05)
- [ ] **3.2.9** Implement `forgotPassword(email)` — generate reset token, hash + store in `password_reset_tokens`, send email via SendGrid (FR-AUTH-09)
- [ ] **3.2.10** Implement `resetPassword(token, newPassword)` — validate token, hash new password, update `users.password_hash`, revoke ALL refresh tokens for user (FR-AUTH-09, FR-AUTH-10)
- [ ] **3.2.11** Implement `enable2fa()` — generate TOTP secret via speakeasy, store `totp_secret` on user, return secret + QR code URL (FR-AUTH-08, US-005)
- [ ] **3.2.12** Implement `verify2fa(loginToken, code)` — for 2FA step during login: verify TOTP code against stored secret, issue full tokens (FR-AUTH-08)

**Refs:** SRS §3.1, URD §3.1, API §Authentication

### 3.3 — Auth Controller

- [ ] **3.3.1** Create `src/auth/auth.controller.ts` with all endpoints per API.md:
  - `POST /auth/register`
  - `POST /auth/login`
  - `POST /auth/refresh`
  - `POST /auth/logout` (authenticated)
  - `POST /auth/verify-email`
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
  - `POST /auth/google`
  - `POST /auth/login/phone`
  - `POST /auth/2fa/enable` (authenticated)
  - `POST /auth/2fa/verify` (with loginToken)
- [ ] **3.3.2** Apply rate limiting decorators: `@Throttle(5, 900)` on login/register

**Refs:** API §Authentication, URD §3.1

### 3.4 — Google OAuth Strategy

- [ ] **3.4.1** Create `src/auth/strategies/google.strategy.ts` — verify Google ID token via `google-auth-library` (OAuth 2.0 flow handled by frontend; backend only validates the idToken)

**Refs:** FR-AUTH-06, US-003

### 3.5 — Auth Module Assembly

- [ ] **3.5.1** Create `src/auth/auth.module.ts` — imports: PassportModule, JwtModule.registerAsync(), PrismaModule, SendGrid module; provides: JwtStrategy, GoogleStrategy, AuthService; exports: AuthService

**Refs:** SDD §3.1 (auth/)

---

## Phase 4 — Numbers Module

### 4.1 — Numbers Service

- [ ] **4.1.1** Create `src/numbers/numbers.service.ts`
- [ ] **4.1.2** Implement `getMyNumbers(userId)` — query `phone_numbers` WHERE `user_id = userId`, return all with capabilities (FR-NUM-04, FR-NUM-05)
- [ ] **4.1.3** Implement `searchAvailableNumbers(countryCode, areaCode?, capabilities?)` — call `telephonyProvider.searchAvailableNumbers()` via PAL, return up to 20 results with locality/region/capabilities/monthlyCost (FR-NUM-01)
- [ ] **4.1.4** Implement `provisionNumber(userId, number)` — check user's current number count against plan limit (`plans.max_numbers` via Redis cache), call `telephonyProvider.provisionNumber()`, store in `phone_numbers` table with `provider`, `provider_sid`, `country_code`, `capabilities`, `monthly_cost`; return within 10 seconds (FR-NUM-03)
- [ ] **4.1.5** Implement `releaseNumber(userId, numberId)` — verify ownership, call `telephonyProvider.releaseNumber()`, set status to `releasing`, set `released_at = now()`, schedule 7-day grace cleanup job; remove from Redis cache (FR-NUM-07, FR-NUM-08)
- [ ] **4.1.6** Implement `getUserByNumber(number)` — Redis-first lookup (SDD §9: 24h TTL) → fallback to DB; used by webhook handlers for inbound SMS/call routing

**Refs:** SRS §3.2, URD §3.2, SDD §9 (caching)

### 4.2 — Numbers Controller

- [ ] **4.2.1** Create `src/numbers/numbers.controller.ts` — all endpoints require JWT auth:
  - `GET /numbers` — list user's numbers
  - `GET /numbers/search?countryCode=US&areaCode=415&capabilities=voice,sms` — search available
  - `POST /numbers` — provision `{ "number": "+14155559876" }`
  - `DELETE /numbers/:id` — release number

**Refs:** API §Phone Numbers

### 4.3 — Numbers Module Assembly

- [ ] **4.3.1** Create `src/numbers/numbers.module.ts` — imports: PrismaModule, TelephonyModule

**Refs:** SDD §3.1 (numbers/)

---

## Phase 5 — Messaging Module

### 5.1 — Messaging Service

- [ ] **5.1.1** Create `src/messaging/messaging.service.ts`
- [ ] **5.1.2** Implement `getConversations(userId, page, limit)` — query `conversations` for user, join latest message + contact name, return paginated (FR-MSG-06)
- [ ] **5.1.3** Implement `getMessages(conversationId, userId, page, limit)` — verify conversation belongs to user, query `messages` paginated 50/page, ordered by `created_at DESC` (FR-MSG-06)
- [ ] **5.1.4** Implement `sendMessage(userId, dto)` — validate `toNumber` is valid E.164, validate `fromNumber` is owned by user (FR-MSG-01), check SMS quota in Redis (FR-BILL-01), if `scheduledAt` is set → store and schedule via BullMQ; else → call `telephonyProvider.sendMessage()`, create/find `conversation`, insert `message` with `provider`, `provider_sid`, `status: 'queued'`, update `conversations.last_message_at`, emit `message:new` WebSocket event, return 201 (FR-MSG-01, FR-MSG-02, FR-MSG-09)
- [ ] **5.1.5** Implement `deleteMessage(messageId, userId)` — soft-delete (set `body = null`, `status = 'deleted'`) for user's view only (FR-MSG-08)
- [ ] **5.1.6** Implement `sendGroupMessage(userId, dto)` — accept `toNumbers: string[]` (max 10), loop sendMessage per recipient (FR-MSG-07)
- [ ] **5.1.7** Implement `searchConversations(userId, query)` — full-text search on message body + contact names (US-025)

**Refs:** SRS §3.3, URD §3.3, SDD §3.2 (flow)

### 5.2 — Webhook Controller (Inbound SMS + Status)

- [ ] **5.2.1** Create `src/messaging/webhooks/sms-webhook.controller.ts`
- [ ] **5.2.2** Handle `POST /webhooks/:provider/sms` — apply `WebhookSignatureGuard`, call `provider.parseInboundMessageWebhook(req)`, lookup owner via `NumbersService.getUserByNumber(normalized.to)`, reject 404 if unowned (FR-MSG-10), find/create `conversation`, insert `message` record with `direction: 'inbound'`, emit `message:new` WebSocket event to owner, return TwiML/NCCO/BXML confirmation via `provider.generateCallControlResponse({ type: 'empty' })` (FR-MSG-02)
- [ ] **5.2.3** Handle `POST /webhooks/:provider/sms/status` — apply `WebhookSignatureGuard`, call `provider.parseStatusCallback(req)`, find message by `provider_sid`, update `messages.status` using normalized status from status map, emit `message:status` WebSocket event (FR-MSG-05, FR-MSG-12)

**Refs:** SDD §3.4, PAL §5, URD UC-03

### 5.3 — Messaging Gateway (WebSocket)

- [ ] **5.3.1** Create `src/messaging/messaging.gateway.ts` — `@WebSocketGateway({ namespace: '/ws', cors: true })`
- [ ] **5.3.2** Implement `handleConnection(client)` — verify JWT from auth handshake, extract userId, join `user:{userId}` room, authenticate connection
- [ ] **5.3.3** Implement `emitNewMessage(userId, message)` — emit `message:new` to `user:{userId}` room (SDD §3.3)
- [ ] **5.3.4** Implement `emitMessageStatus(userId, messageId, status)` — emit `message:status` to `user:{userId}` room

**Refs:** SDD §3.3, SDD §6.1, API §WebSocket Events

### 5.4 — Messaging Module Assembly

- [ ] **5.4.1** Create `src/messaging/messaging.module.ts` — imports: PrismaModule, TelephonyModule, NumbersModule, EventEmitterModule

**Refs:** SDD §3.1 (messaging/)

---

## Phase 6 — Calling Module

### 6.1 — Calling Service

- [ ] **6.1.1** Create `src/calling/calling.service.ts`
- [ ] **6.1.2** Implement `getCallToken(userId)` — generate WebRTC client token via `telephonyProvider.generateClientToken(user.id)`, store in Redis with 55-min TTL, return `{ token, expiresIn: 3600, provider }` (FR-CALL-01)
- [ ] **6.1.3** Implement `getCallHistory(userId, page, limit, direction?)` — query `calls` table paginated (FR-CALL-11, US-037)
- [ ] **6.1.4** Implement `createCallRecord(userId, providerCallSid, provider, fromNumber, toNumber, direction)` — insert row in `calls` with `status: 'initiated'`, `started_at: NOW()` (FR-CALL-11)

**Refs:** SRS §3.4, URD §3.4, API §Calling

### 6.2 — Voice Webhook Controller

- [ ] **6.2.1** Create `src/calling/webhooks/voice-webhook.controller.ts`
- [ ] **6.2.2** Handle `POST /webhooks/:provider/voice` — apply `WebhookSignatureGuard`, call `provider.parseInboundCallWebhook(req)`, lookup owner by `to` number, if not found → `provider.generateCallControlResponse({ type: 'reject' })`, create CDR row, emit `call:inbound` WebSocket to owner, return `provider.generateCallControlResponse({ type: 'dial-client', clientId: user.id, timeout: 30, voicemailRedirect })` (FR-CALL-02, SDD §7.2)
- [ ] **6.2.3** Handle `POST /webhooks/:provider/voice/status` — apply `WebhookSignatureGuard`, call `provider.parseStatusCallback(req)`, find call by `provider_call_sid`, update `status`, if `in-progress` → record heatbeat; if `completed` → set `duration_seconds`, `ended_at`, calculate `cost`; if `no-answer` or `failed` → check if voicemail was left → create `voicemail` record; emit `call:status` WebSocket event (FR-CALL-07, FR-CALL-09, FR-CALL-11)
- [ ] **6.2.4** Handle `POST /webhooks/:provider/voice/voicemail` — receive recording URL from provider (or hold music timeout), store in S3/R2, insert `voicemails` record with `recording_url`, attempt transcription via `provider.transcribeRecording()` if available, else fall back to external STT (OpenAI Whisper) (FR-CALL-08)

**Refs:** SDD §3.4, SDD §7.2, PAL §5, SDD §7.3

### 6.3 — Calling Gateway (WebSocket)

- [ ] **6.3.1** Create `src/calling/calling.gateway.ts`
- [ ] **6.3.2** Implement `emitInboundCall(userId, callData)` — emit `call:inbound` to `user:{userId}` room
- [ ] **6.3.3** Implement `emitCallStatus(userId, callSid, status, duration)` — emit `call:status` to `user:{userId}` room

**Refs:** SDD §3.3, SDD §6.1, API §WebSocket Events

### 6.4 — Voicemail Controller

- [ ] **6.4.1** Create `GET /voicemails` in calling controller — list user's voicemails with transcript + recordingUrl
- [ ] **6.4.2** Create `PATCH /voicemails/:id` — mark as read (US-034)
- [ ] **6.4.3** Create `GET /voicemails/:id/recording` — generate signed S3 URL, redirect

**Refs:** API §Calling (voicemails), FR-CALL-07, FR-CALL-08

### 6.5 — Calling Module Assembly

- [ ] **6.5.1** Create `src/calling/calling.module.ts` — imports: PrismaModule, TelephonyModule, NumbersModule, EventEmitterModule

---

## Phase 7 — Contacts Module

### 7.1 — Contacts Service

- [ ] **7.1.1** Create `src/contacts/contacts.service.ts` (FR-CON-01)
- [ ] **7.1.2** Implement `listContacts(userId, search?, tag?, page?, limit?)` — search by name/number, filter by tag (FR-CON-04, FR-CON-06)
- [ ] **7.1.3** Implement `createContact(userId, dto)` — insert `contacts` + `contact_phones` (FR-CON-01, FR-CON-02)
- [ ] **7.1.4** Implement `updateContact(userId, contactId, dto)` — update contact + sync phones (FR-CON-01)
- [ ] **7.1.5** Implement `deleteContact(userId, contactId)` (FR-CON-01)
- [ ] **7.1.6** Implement `importContacts(userId, csvBuffer)` — parse CSV (columns: name, phone, email, notes, tags), bulk insert (FR-CON-03, US-051)
- [ ] **7.1.7** Implement `matchContact(fromNumber, userId)` — search contacts + contact_phones for matching number, return contact name if found (FR-CON-05)

**Refs:** SRS §3.6, URD §3.6, API §Contacts

### 7.2 — Contacts Controller

- [ ] **7.2.1** All CRUD endpoints: `GET /contacts`, `POST /contacts`, `PUT /contacts/:id`, `DELETE /contacts/:id`
- [ ] **7.2.2** `POST /contacts/import` — multipart upload

**Refs:** API §Contacts

---

## Phase 8 — Dialer Module (NestJS Proxy to Go Service)

> **⚠️ Split architecture:** The **Go Echo microservice** handles the actual dialing engine (worker pool, outbound calls, retry logic, calling hours, etc.). Its complete task list is in **[roadmap/dialer-tasks.md](roadmap/dialer-tasks.md)**.
>
> This NestJS Dialer module is the **front-end proxy**: it manages campaign CRUD, CSV upload/validation, DNC lists, and communicates with the Go service via internal HTTP. The Go service calls back to NestJS for progress updates, which this module broadcasts to the frontend via WebSocket.
>
> ```
> Browser ──REST/WS──► NestJS DialerModule ──HTTP──► Go Echo Dialer
>                              ▲                          │
>                              └───── progress callback ──┘
> ```

### 8.1 — Dialer Service (Go HTTP Client)

- [ ] **8.1.1** Create `src/dialer/dialer.service.ts` — HTTP client wrapping calls to the Go dialer service
- [ ] **8.1.2** Implement `createCampaign(userId, dto, csvBuffer)` — pre-validate CSV (parse, check phone column, validate E.164 format, check DNC list via csv-validator), report invalid rows in response, insert `campaigns` row + bulk insert `campaign_contacts` in PostgreSQL (FR-PD-01, FR-PD-02, FR-PD-03). **Does NOT start the campaign yet.**
- [ ] **8.1.3** Implement `listCampaigns(userId, page, limit)` — query `campaigns` for user, return paginated (FR-PD-07)
- [ ] **8.1.4** Implement `getCampaign(userId, campaignId)` — query campaign + live progress if running (FR-PD-07)
- [ ] **8.1.5** Implement `startCampaign(userId, campaignId)` — verify user owns campaign, verify `from_number` is active and owned, check user's `power_dialer_enabled` plan flag (via Redis cache), POST to Go dialer `http://dialer:8080/campaigns` with campaign config + contact list array, update local campaign status to `running` on success response, return campaign (FR-PD-06, US-042)
- [ ] **8.1.6** Implement `pauseCampaign(userId, campaignId)` — POST to Go `http://dialer:8080/campaigns/:id/pause`, update local status to `paused` (FR-PD-06, US-044)
- [ ] **8.1.7** Implement `resumeCampaign(userId, campaignId)` — POST to Go `http://dialer:8080/campaigns/:id/resume`, update local status to `running`
- [ ] **8.1.8** Implement `stopCampaign(userId, campaignId)` — POST to Go `http://dialer:8080/campaigns/:id/stop`, update local status to `stopped` (FR-PD-06)
- [ ] **8.1.9** Implement `exportCampaignResults(userId, campaignId)` — proxy to Go `GET http://dialer:8080/campaigns/:id/export`, OR query `campaign_contacts` locally and generate CSV with columns: phone, name, notes, status, attempts, call_duration, last_attempted_at (FR-PD-09, US-047)
- [ ] **8.1.10** Implement `handleProgressCallback(campaignId, progress)` — **called by Go service** via internal endpoint, update `campaigns` counters (dialed, answered, failed, busy, no_answer), emit `campaign:progress` WebSocket to `campaign:{id}` room. If progress indicates completion, emit `campaign:complete`. (FR-PD-07, FR-PD-08, SDD §4.4)
- [ ] **8.1.11** Implement `getCampaignResults(userId, campaignId, page, limit)` — proxy to Go `GET http://dialer:8080/campaigns/:id/results?page=&limit=`, return paginated contact results

**Refs:** SRS §3.5, URD §3.5, SDD §4.3, SDD §4.4, API §Power Dialer, [dialer-tasks.md §6](roadmap/dialer-tasks.md)

### 8.2 — CSV Validation (Pre-Upload)

> **Note:** CSV parsing happens in both NestJS (pre-validation before sending to Go) and Go (final parse before enqueuing). This gives the user immediate feedback before the campaign is created.

- [ ] **8.2.1** Create `src/dialer/csv-validator.ts` — parse CSV with `csv-parse`, detect `phone` column (case-insensitive match: `phone`, `phonenumber`, `number`, `mobile`, `tel`), validate each number against E.164 regex, check against `dnc_list` for user, return report: `{ total, valid, invalid: [{row, reason}], dncSkipped }` (FR-PD-02, FR-PD-03, FR-PD-11)
- [ ] **8.2.2** Reject files with 0 valid rows with clear error message
- [ ] **8.2.3** Support optional `name` and `notes` columns — include if present, ignore unknown columns

**Refs:** URD AC for US-040

### 8.3 — Dialer Controller (REST)

- [ ] **8.3.1** Create `src/dialer/dialer.controller.ts` — all endpoints require JWT auth:
  - `GET /campaigns?page=1&limit=20` — list user's campaigns
  - `POST /campaigns` — create campaign (multipart/form-data with CSV file + campaign config fields)
  - `GET /campaigns/:id` — get campaign detail + live progress
  - `POST /campaigns/:id/start` — forward to Go service
  - `POST /campaigns/:id/pause` — forward to Go service
  - `POST /campaigns/:id/resume` — forward to Go service
  - `POST /campaigns/:id/stop` — forward to Go service (irreversible)
  - `GET /campaigns/:id/results?page=1&limit=50` — paginated contact results
  - `GET /campaigns/:id/export` — CSV file download

**Refs:** API §Power Dialer

### 8.4 — Internal Callback Controller (Go → NestJS)

- [ ] **8.4.1** Create `src/dialer/internal/dialer-callback.controller.ts`
- [ ] **8.4.2** Handle `POST /internal/dialer/callback` — **no JWT** (uses `INTERNAL_API_KEY` header), receives:
  ```json
  { "campaignId": "uuid", "dialed": 50, "answered": 20, "failed": 3,
    "busy": 2, "noAnswer": 5, "remaining": 770 }
  ```
- [ ] **8.4.3** Validate `INTERNAL_API_KEY` via custom guard — reject 401 if missing/invalid
- [ ] **8.4.4** Call `DialerService.handleProgressCallback()`, return 200 `{ "success": true }`

**Refs:** SDD §4.4, [dialer-tasks.md §9](roadmap/dialer-tasks.md)

### 8.5 — Dialer Gateway (WebSocket to Frontend)

- [ ] **8.5.1** Create `src/dialer/dialer.gateway.ts` — `@WebSocketGateway({ namespace: '/ws', cors: true })`
- [ ] **8.5.2** Implement `handleConnection(client)` — verify JWT, extract userId, join `user:{userId}` room
- [ ] **8.5.3** On client subscribe to campaign: join `campaign:{campaignId}` room (via client-emitted `campaign:subscribe` event or REST-triggered server-side join)
- [ ] **8.5.4** Implement `emitCampaignProgress(campaignId, data)` — emit `campaign:progress` to `campaign:{campaignId}` room
- [ ] **8.5.5** Implement `emitCampaignComplete(campaignId, summary)` — emit `campaign:complete` to `campaign:{campaignId}` room

**Refs:** SDD §6.1, API §WebSocket Events

### 8.6 — DNC List Management

- [ ] **8.6.1** Create `POST /dnc` — manually add phone number to DNC list (E.164 validated)
- [ ] **8.6.2** Create `GET /dnc?page=1&limit=50` — list user's DNC numbers with source and date
- [ ] **8.6.3** Create `DELETE /dnc/:id` — remove from DNC
- [ ] **8.6.4** Integrate DNC check into campaign CSV validation (8.2.1) and campaign creation (8.1.2)
- [ ] **8.6.5** Auto-add to DNC on campaign opt-out: if contact replies STOP/UNSUBSCRIBE to campaign SMS, add to DNC with `source = 'campaign_opt_out'` (this is handled by messaging webhook, not dialer module)

**Refs:** FR-PD-11, US-049

### 8.7 — Dialer Module Assembly

- [ ] **8.7.1** Create `src/dialer/dialer.module.ts` — imports: `PrismaModule`, `HttpModule` (Axios for Go HTTP calls), `EventEmitterModule`; provides: `DialerService`, `CsvValidator`; exports: `DialerService`
- [ ] **8.7.2** Configure `HttpModule.registerAsync()` with `DIALER_SERVICE_URL` from config, timeout 30s, `Authorization: Bearer {INTERNAL_API_KEY}` default header

---

## Phase 9 — Billing Module

### 9.1 — Billing Service

- [ ] **9.1.1** Create `src/billing/billing.service.ts`
- [ ] **9.1.2** Implement `getCurrentUsage(userId)` — query `usage_records` for current period (`period_start <= NOW() AND period_end >= NOW()`), compute vs plan limits from Redis cache + plans table (FR-BILL-01, FR-BILL-05)
- [ ] **9.1.3** Implement `getInvoices(userId)` — query `invoices` table (FR-BILL-06)
- [ ] **9.1.4** Implement `createCheckoutSession(userId, planId)` — call Stripe Checkout, store `stripe_checkout_session_id` (FR-BILL-02, FR-BILL-03)
- [ ] **9.1.5** Implement `upgradePlan(userId, planId)` — call Stripe API to swap price, update `subscriptions` (US-061)
- [ ] **9.1.6** Implement `getInvoicePdf(userId, invoiceId)` — fetch `pdf_url` or generate via Stripe Invoice PDF (US-062)

**Refs:** SRS §3.7, URD §3.7, API §Billing

### 9.2 — Stripe Webhook Controller

- [ ] **9.2.1** Create `src/billing/webhooks/stripe-webhook.controller.ts`
- [ ] **9.2.2** Handle `POST /webhooks/stripe` (no auth — use Stripe signature verification)
- [ ] **9.2.3** Handle `checkout.session.completed` → activate subscription, create usage_records row
- [ ] **9.2.4** Handle `invoice.paid` → insert/update `invoices` row, update `subscriptions.current_period_end`
- [ ] **9.2.5** Handle `invoice.payment_failed` → mark subscription `past_due`, notify user
- [ ] **9.2.6** Handle `customer.subscription.deleted` → mark subscription `canceled`, downgrade to Free plan

**Refs:** FR-BILL-03, FR-BILL-06, SDD §3.1 (billing/webhooks/)

### 9.3 — Billing Controller

- [ ] **9.3.1** Authenticated endpoints: `GET /billing/usage`, `GET /billing/invoices`, `POST /billing/upgrade`

**Refs:** API §Billing

### 9.4 — Usage Tracking Service

- [ ] **9.4.1** Create `src/billing/usage-tracker.service.ts` — called by MessagingService (after send), CallingService (after call end), NumbersService (after provision/release)
- [ ] **9.4.2** Increment counters: `minutes_used`, `sms_sent`, `sms_received`, `numbers_held` on `usage_records`
- [ ] **9.4.3** Check plan limits before each operation — throw `PLAN_LIMIT_EXCEEDED` if over
- [ ] **9.4.4** Send email alert at 80% and 100% via SendGrid (FR-BILL-04, US-063)
- [ ] **9.4.5** Run daily cron job: check all users approaching limit, send alerts

**Refs:** FR-BILL-01, FR-BILL-04, FR-BILL-07

---

## Phase 10 — Message Templates Module

### 10.1 — Templates Service

- [ ] **10.1.1** Create `src/messaging/templates.service.ts`
- [ ] **10.1.2** CRUD: create, list, update, delete templates per user
- [ ] **10.1.3** Implement variable interpolation: `{customer_name}`, `{order_number}` etc. (FR-MSG-11, US-024)
- [ ] **10.1.4** Create controller endpoints: `GET /templates`, `POST /templates`, `PUT /templates/:id`, `DELETE /templates/:id`

**Refs:** FR-MSG-11, US-024

---

## Phase 11 — API Keys Module (API Users — Persona 4)

### 11.1 — API Key Service

- [ ] **11.1.1** Create `src/api-keys/api-keys.service.ts`
- [ ] **11.1.2** Implement `createApiKey(userId, name, scopes)` — generate cryptographically random key (e.g., `vl_` + 32 bytes hex), hash with bcrypt, store hashed; return plaintext ONLY ONCE (SR-08)
- [ ] **11.1.3** Implement `listApiKeys(userId)` — return with `key_prefix` (first 8 chars) and metadata, never the hash
- [ ] **11.1.4** Implement `revokeApiKey(userId, keyId)` — set `revoked_at`
- [ ] **11.1.5** Create `ApiKeyAuthGuard` — extract from `Authorization: Bearer vl_...`, hash, lookup in `api_keys`, check not revoked/expired, attach user + scopes to request

**Refs:** SR-08, URD Persona 4

---

## Phase 12 — Audit Module

### 12.1 — Audit Service

- [ ] **12.1.1** Create `src/audit/audit.service.ts`
- [ ] **12.1.2** Implement `log(action, userId, resourceType, resourceId, details, ip, userAgent)` — fire-and-forget insert into `audit_logs` (SR-09)
- [ ] **12.1.3** Emit audit events from all critical actions: user created, number provisioned/released, campaign started/stopped, plan changed, API key created/revoked, admin actions
- [ ] **12.1.4** Create admin-only endpoint: `GET /admin/audit-logs?userId=&action=&resourceType=&page=&limit=`

**Refs:** SR-09

---

## Phase 13 — Scheduled Jobs (Cron)

### 13.1 — Job Definitions

- [ ] **13.1.1** `NumberGracePeriodJob` — runs daily: find `phone_numbers` WHERE `status = 'releasing' AND released_at < NOW() - INTERVAL '7 days'`, call `provider.releaseNumber()`, set `status = 'released'` (FR-NUM-08)
- [ ] **13.1.2** `UsageAlertJob` — runs daily: check all `usage_records` for current period, if usage ≥ 80% of plan limit, send email via SendGrid (FR-BILL-04)
- [ ] **13.1.3** `InvoiceGenerationJob` — runs 1st of month: generate `invoices` rows for previous month, trigger Stripe invoice creation
- [ ] **13.1.4** `DataRetentionJob` — runs daily: delete `messages` older than 2 years, delete `voicemails` older than 90 days (or 1 year for Business), delete `password_reset_tokens` older than 24h, delete `otp_codes` older than 5 min (SRS §6.2)
- [ ] **13.1.5** `TokenCleanupJob` — runs daily: delete expired `refresh_tokens` and `email_verification_tokens` (FR-AUTH-05)
- [ ] **13.1.6** `ScheduledMessageJob` — runs every minute: find `messages` WHERE `scheduled_at <= NOW() AND status = 'pending_scheduled'`, call `telephonyProvider.sendMessage()`, update status (FR-MSG-09)

**Refs:** SRS §6.2, FR-NUM-08, FR-BILL-04, FR-MSG-09

---

## Phase 14 — Main.ts & AppModule Assembly

### 14.1 — Main.ts

- [ ] **14.1.1** Update `main.ts`: bootstrap with `NestFactory.create(AppModule)`
- [ ] **14.1.2** Enable CORS with explicit allowlist from config (SR-04)
- [ ] **14.1.3** Register global pipes, filters, interceptors, guards from Phase 1
- [ ] **14.1.4** Set up Swagger/OpenAPI docs at `GET /api/v1/docs` (SRS §4.2)
- [ ] **14.1.5** Set global prefix: `app.setGlobalPrefix('api/v1', { exclude: ['webhooks/(.*)', 'internal/(.*)', 'health'] })` — webhook routes and internal callback routes must NOT have the `/api/v1` prefix (SRS §4.2, SDD §3.4)
- [ ] **14.1.6** Listen on `PORT` env var (default 4000 per SDD §8.1)

### 14.2 — AppModule

- [ ] **14.2.1** Wire all modules into `AppModule`:
  - `PrismaModule` (global)
  - `ConfigModule` (global)
  - `ThrottlerModule` (global)
  - `ScheduleModule` (global, for cron jobs)
  - `EventEmitterModule` (global)
  - `TelephonyModule` (global — exports `TELEPHONY_PROVIDER`)
  - `AuthModule`
  - `NumbersModule`
  - `MessagingModule`
  - `CallingModule`
  - `ContactsModule`
  - `DialerModule` — **proxies to Go Echo service** via `HttpModule` (Axios)
  - `BillingModule`
  - `TemplatesModule`
  - `ApiKeysModule`
  - `AuditModule`
  - `BullModule` (Redis-backed queues)
- [ ] **14.2.2** `DialerModule` must import `HttpModule.registerAsync()` configured with `DIALER_SERVICE_URL` (default `http://dialer:8080`) and `INTERNAL_API_KEY` for service-to-service auth

**Refs:** SDD §3.1, SDD §4.4

---

## Phase 15 — Testing

### 15.1 — Unit Tests

- [ ] **15.1.1** `AuthService` — register, login, refresh rotation, password reset, 2FA
- [ ] **15.1.2** `NumbersService` — provision within plan limit, release with grace period
- [ ] **15.1.3** `MessagingService` — send SMS, quota check, scheduled message
- [ ] **15.1.4** `CallingService` — token generation, CDR creation
- [ ] **15.1.5** `TwilioProvider` — all methods with mocked Twilio SDK
- [ ] **15.1.6** `DialerService` — campaign CRUD, CSV validation, DNC check, **Go service HTTP mock** (mock Axios responses for start/pause/resume/stop/export)
- [ ] **15.1.7** `DialerCallbackController` — validates INTERNAL_API_KEY, rejects unauthorized, handles progress payload, emits WebSocket events
- [ ] **15.1.8** `BillingService` — usage tracking, plan limits
- [ ] **15.1.9** `UsageTrackerService` — 80% alert

### 15.2 — E2E Tests

- [ ] **15.2.1** Registration → email verification → login → JWT refresh flow
- [ ] **15.2.2** Phone OTP login flow
- [ ] **15.2.3** Google OAuth login flow (mocked)
- [ ] **15.2.4** Number search → provision → release flow
- [ ] **15.2.5** Send SMS → receive status webhook → delivery status update
- [ ] **15.2.6** Inbound SMS webhook → message stored → WebSocket event
- [ ] **15.2.7** Call token → inbound call webhook → CDR → hangup webhook
- [ ] **15.2.8** Voicemail webhook → recording stored → transcription
- [ ] **15.2.9** Campaign create (CSV upload) → validation report → start (mock Go HTTP response) → receive progress callback → emit WebSocket → pause → resume → stop → export CSV
- [ ] **15.2.10** Internal callback auth: reject missing INTERNAL_API_KEY, reject wrong key, accept correct key
- [ ] **15.2.11** Stripe webhook → subscription activation → invoice generation
- [ ] **15.2.12** Plan upgrade/downgrade flow
- [ ] **15.2.13** API key create → authenticate → revoke

---

## Phase 16 — Docker & CI

- [ ] **16.1** Create `backend/Dockerfile` — multi-stage build (build → deps install → production)
- [ ] **16.2** Wire into root `docker-compose.yml` per SDD §8.1 — NestJS API on port 4000
- [ ] **16.3** Ensure `docker-compose.yml` includes the **Go dialer service** (see [dialer-tasks.md §13](roadmap/dialer-tasks.md) and SDD §8.1) — NestJS depends on `dialer` being healthy
- [ ] **16.4** Add health check endpoint: `GET /health` returning `{ status: 'ok', db: 'connected', redis: 'connected', dialer: 'connected' }` — ping DB, Redis, AND Go dialer `/health`
- [ ] **16.5** Seed default plans in Prisma migration/seed

---

## Task Summary

| Phase | Modules | # Tasks | Priority |
|-------|---------|---------|----------|
| 0 — Foundation | Dependencies, Config, Prisma | 18 | Blocker |
| 1 — Common Layer | Filters, Interceptors, Pipes, Guards, Decorators, Middleware | 10 | Blocker |
| 2 — Telephony PAL | Interface, TwilioProvider, Stubs, Status Maps | 21 | Blocker |
| 3 — Auth Module | JWT, Registration, Login, OAuth, OTP, 2FA, Password Reset | 22 | Critical |
| 4 — Numbers Module | Search, Provision, Release, Caching | 9 | Critical |
| 5 — Messaging Module | Send SMS, Conversations, Webhooks, WebSocket Gateway | 14 | Critical |
| 6 — Calling Module | WebRTC Token, Voice Webhooks, Voicemail, CDRs | 13 | Critical |
| 7 — Contacts Module | CRUD, CSV Import, Auto-match | 9 | Medium |
| 8 — Dialer Module (NestJS Proxy) | Campaign CRUD, CSV Validate, Go HTTP Client, WebSocket, DNC | 26 | High |
| 9 — Billing Module | Stripe, Usage Tracking, Invoices, Alerts | 14 | High |
| 10 — Templates Module | CRUD, Variable Interpolation | 5 | Low |
| 11 — API Keys Module | Generate, List, Revoke, Auth Guard | 6 | Low |
| 12 — Audit Module | Log, Admin Endpoint | 4 | Low |
| 13 — Scheduled Jobs | Grace Period, Alerts, Invoices, Retention, Cleanup | 6 | Medium |
| 14 — Main & AppModule | Bootstrap, Swagger, CORS, Global Prefix, Wire All Modules | 6 | Blocker |
| 15 — Testing | 8 unit + 12 e2e | 20 | Per-phase |
| 16 — Docker & CI | Dockerfile, Health Check, Compose | 4 | Deployment |
| — | **Go Echo Dialer Service** (separate microservice) | **[~139 tasks](roadmap/dialer-tasks.md)** | **See dialer-tasks.md** |

**NestJS Total: ~207 tasks**
**Go Dialer Total: ~139 tasks (separate file)**
**Grand Total: ~346 tasks**

---

*Generated from SDD §3, SRS §3–8, PAL §1–12, URD Use Cases, API Reference*
*Go Echo Dialer tasks: see [roadmap/dialer-tasks.md](roadmap/dialer-tasks.md)*
