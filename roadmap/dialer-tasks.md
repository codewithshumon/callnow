# VoiceLink Go Echo Dialer — Complete Task List

> **Derived from:** SDD §4, SRS §3.5, PAL §1–12, URD Use Cases, API Reference
> **Stack:** Go 1.22 · Echo v4 · pgx v5 · Redis 7 · Twilio SDK (v1 active)
> **Current state:** Empty — new service to build from scratch
> **Target:** Complete production-ready power dialer microservice
>
> **📎 Related:** The NestJS side that proxies to this service lives in **[roadmap/backend-tasks.md](roadmap/backend-tasks.md)** (Phase 8 — Dialer Module). This service is called by NestJS via internal HTTP and calls back to NestJS for progress updates.

---

## Best-Practice Folder Structure

```
/dialer-service
├── cmd/
│   └── server/
│       └── main.go                    # Entry point — bootstrap & shutdown
├── internal/
│   ├── api/
│   │   ├── router.go                  # Echo instance setup, route registration
│   │   ├── handler/
│   │   │   ├── campaign_handler.go    # HTTP handlers for campaign endpoints
│   │   │   ├── health_handler.go      # Health check handler
│   │   │   └── handler_test.go
│   │   ├── middleware/
│   │   │   ├── auth.go                # INTERNAL_API_KEY validation
│   │   │   ├── logging.go             # Structured request logging
│   │   │   ├── recovery.go            # Panic recovery
│   │   │   └── requestid.go           # X-Request-ID propagation
│   │   └── dto/
│   │       ├── request.go             # Incoming request structs + validation
│   │       └── response.go            # Outgoing response structs
│   ├── domain/
│   │   ├── campaign.go                # Campaign entity (pure domain model)
│   │   ├── contact.go                 # CampaignContact entity
│   │   ├── call_result.go             # Call outcome value object
│   │   └── errors.go                  # Domain-specific error types
│   ├── campaign/
│   │   ├── service.go                 # Campaign business logic (orchestration)
│   │   ├── service_test.go
│   │   ├── worker_pool.go             # Goroutine pool with semaphore
│   │   ├── worker_pool_test.go
│   │   ├── lifecycle.go              # State machine: draft→running→paused→completed→stopped
│   │   ├── lifecycle_test.go
│   │   ├── csv_parser.go             # CSV parsing & validation
│   │   ├── csv_parser_test.go
│   │   ├── retry.go                  # Retry strategy logic
│   │   └── retry_test.go
│   ├── dialer/
│   │   ├── provider.go               # TelephonyProvider Go interface
│   │   ├── twilio_client.go          # Twilio implementation (active v1)
│   │   ├── twilio_client_test.go
│   │   ├── stub_clients.go           # Vonage/Bandwidth/Plivo/Telnyx stubs
│   │   ├── call_outcome.go           # Result classification: answered/no-answer/busy/failed
│   │   └── voicemail_drop.go         # Pre-recorded message delivery on no-answer
│   ├── queue/
│   │   ├── redis_queue.go            # Redis-backed contact queue (BLPOP/BRPOP)
│   │   ├── redis_queue_test.go
│   │   └── memory_queue.go           # In-memory queue for testing
│   ├── repository/
│   │   ├── postgres/
│   │   │   ├── campaign_repo.go      # Campaign CRUD queries (pgx)
│   │   │   ├── campaign_repo_test.go
│   │   │   ├── contact_repo.go       # CampaignContact queries
│   │   │   ├── contact_repo_test.go
│   │   │   ├── dnc_repo.go           # DNC list queries
│   │   │   └── dnc_repo_test.go
│   │   └── repository.go             # Repository interfaces (for mocking)
│   ├── callback/
│   │   ├── client.go                 # HTTP client for NestJS progress callbacks
│   │   └── client_test.go
│   └── clock/
│       └── clock.go                  # Time interface wrapper (for testable time-based logic)
├── config/
│   ├── config.go                     # Env parsing + validation (caarlos0/env or manual)
│   └── config_test.go
├── migrations/
│   ├── 001_campaign_indexes.up.sql   # Any Go-managed DB indexes
│   └── 001_campaign_indexes.down.sql
├── test/
│   ├── integration/
│   │   ├── campaign_flow_test.go     # Full campaign lifecycle integration test
│   │   └── testutil/
│   │       ├── db.go                 # Test DB setup (testcontainers or docker)
│   │       └── redis.go              # Test Redis setup
│   └── fixtures/
│       ├── valid_contacts.csv
│       └── invalid_contacts.csv
├── Dockerfile
├── go.mod
├── go.sum
├── Makefile
└── .env.example
```

> **Why this structure:** `cmd/` holds the single entry point. `internal/` enforces Go's import visibility boundary — nothing outside `dialer-service` can import these packages. `domain/` holds pure business types with zero framework dependencies. `repository/` interfaces are defined at the package root and implemented in `postgres/`, making the service testable with mocks. `clock/` wraps `time.Now()` so time-gated logic (calling hours, retry backoff) is deterministic in tests.

---

## Phase 0 — Project Foundation

### 0.1 — Go Module Initialization

- [ ] **0.1.1** Initialize Go module: `go mod init github.com/voicelink/dialer-service` (Go 1.22)
- [ ] **0.1.2** Install Echo v4: `go get github.com/labstack/echo/v4`
- [ ] **0.1.3** Install pgx v5 + pgxpool: `go get github.com/jackc/pgx/v5`
- [ ] **0.1.4** Install Redis client: `go get github.com/redis/go-redis/v9`
- [ ] **0.1.5** Install Twilio SDK: `go get github.com/twilio/twilio-go`
- [ ] **0.1.6** Install utilities: `go get github.com/caarlos0/env/v11` (config), `github.com/google/uuid`, `go.uber.org/zap` (structured logging), `github.com/stretchr/testify` (testing), `github.com/joho/godotenv`
- [ ] **0.1.7** Install CSV: `go get encoding/csv` (stdlib — no external dependency needed)

**Refs:** SDD §4.1, PAL §4.3

### 0.2 — Configuration

- [ ] **0.2.1** Create `config/config.go` — define `Config` struct with all fields from SDD §8.3, parse via `caarlos0/env`, validate required fields on startup
- [ ] **0.2.2** Config struct fields: `Port`, `RedisURL`, `DatabaseURL`, `TelephonyProvider`, `TwilioAccountSid`, `TwilioAuthToken`, `NestjsCallbackURL`, `InternalApiKey`, `LogLevel`, `MaxConcurrency`
- [ ] **0.2.3** Validate config at boot: fail fast if required env vars are missing or invalid
- [ ] **0.2.4** Create `.env.example` with all variables documented

**Refs:** SDD §8.3, PAL §4.1

### 0.3 — Logging Setup

- [ ] **0.3.1** Initialize structured logger (zap) with configurable level, JSON format for production, console format for dev
- [ ] **0.3.2** Wire logger into Echo via custom logger middleware that uses zap
- [ ] **0.3.3** Log startup config (redact secrets) and graceful shutdown events

**Refs:** SDD §4.1 (best practice — structured logging)

---

## Phase 1 — Domain Models & Errors

> **Note:** Domain models are pure Go structs in `internal/domain/` with zero framework dependencies. Everything else depends on these — build them first.

### 1.1 — Domain Entities

- [ ] **1.1.1** Create `internal/domain/campaign.go` — `Campaign` struct matching `campaigns` table schema (id, userId, name, status, fromNumber, concurrency, delaySeconds, retryMax, voicemailDropUrl, callingHoursStart, callingHoursEnd, callingHoursTimezone, counters: totalContacts, dialed, answered, failed, busy, noAnswer, scheduledAt, startedAt, pausedAt, completedAt, createdAt)
- [ ] **1.1.2** Define `CampaignStatus` as string enum: `draft`, `running`, `paused`, `completed`, `stopped`
- [ ] **1.1.3** Create `internal/domain/contact.go` — `CampaignContact` struct matching `campaign_contacts` table (id, campaignId, phone, name, notes, status, attempts, callDuration, lastAttemptedAt)
- [ ] **1.1.4** Define `ContactStatus` as string enum: `pending`, `dialing`, `answered`, `no-answer`, `busy`, `failed`, `dnc`
- [ ] **1.1.5** Create `internal/domain/call_result.go` — `CallResult` value object (contactId, status, durationSeconds, errorMessage, timestamp)
- [ ] **1.1.6** Create `internal/domain/errors.go` — domain error types: `ErrCampaignNotFound`, `ErrInvalidStatusTransition`, `ErrContactNotFound`, `ErrQueueEmpty`, `ErrProviderFailure`, `ErrDNCSkip`, `ErrOutsideCallingHours`

**Refs:** SDD §4.2, database-schema.md §9-10, SRS §3.5

### 1.2 — Campaign State Machine

- [ ] **1.2.1** Create `internal/campaign/lifecycle.go` — define valid transitions:
  - `draft → running`
  - `running → paused`
  - `paused → running`
  - `running → completed`
  - `running → stopped`
  - `paused → stopped`
- [ ] **1.2.2** Implement `ValidateTransition(current, next CampaignStatus) error` — reject invalid transitions
- [ ] **1.2.3** Unit test every valid and invalid transition

**Refs:** FR-PD-06, SDD §4.2

---

## Phase 2 — Repository Layer (PostgreSQL via pgx)

> **Note:** Repository interfaces are defined in `internal/repository/repository.go`. Implementations live in `internal/repository/postgres/`. This enables mocking the entire data layer in service tests.

### 2.1 — Repository Interfaces

- [ ] **2.1.1** Create `internal/repository/repository.go` — define `CampaignRepository` interface: `GetByID(ctx, id)`, `GetByUserID(ctx, userID)`, `Create(ctx, campaign)`, `UpdateStatus(ctx, id, status, extra...)`, `UpdateCounters(ctx, id, counters)`, `Delete(ctx, id)`
- [ ] **2.1.2** Define `ContactRepository` interface: `GetByCampaignID(ctx, campaignID, status, limit)`, `GetByID(ctx, id)`, `BulkCreate(ctx, contacts)`, `UpdateStatus(ctx, id, status, duration, attempts)`, `CountByStatus(ctx, campaignID)`
- [ ] **2.1.3** Define `DNCRepository` interface: `IsBlocked(ctx, userID, phone)` , `Add(ctx, userID, phone, source)`, `Remove(ctx, userID, phone)`

**Refs:** SDD §5.1 (Go uses pgx), database-schema.md §9-10

### 2.2 — PostgreSQL Implementation (pgx)

- [ ] **2.2.1** Create `internal/repository/postgres/campaign_repo.go` — implement `CampaignRepository` using pgxpool
- [ ] **2.2.2** `GetByID` — `SELECT * FROM campaigns WHERE id = $1`
- [ ] **2.2.3** `UpdateStatus` — `UPDATE campaigns SET status = $2, started_at = $3, paused_at = $4, completed_at = $5 WHERE id = $1` (set timestamps based on transition)
- [ ] **2.2.4** `UpdateCounters` — atomic increment: `UPDATE campaigns SET dialed = dialed + $2, answered = answered + $3, failed = failed + $4, busy = busy + $5, no_answer = no_answer + $6 WHERE id = $1`, return updated row
- [ ] **2.2.5** Create `internal/repository/postgres/contact_repo.go` — implement `ContactRepository`
- [ ] **2.2.6** `GetByCampaignID` — `SELECT * FROM campaign_contacts WHERE campaign_id = $1 AND status = $2 LIMIT $3` — use `FOR UPDATE SKIP LOCKED` to prevent duplicate dialing by concurrent workers
- [ ] **2.2.7** `BulkCreate` — use pgx `CopyFrom` for high-performance batch insert of CSV contacts
- [ ] **2.2.8** `UpdateStatus` — `UPDATE campaign_contacts SET status = $2, attempts = attempts + 1, call_duration = $3, last_attempted_at = NOW() WHERE id = $1`
- [ ] **2.2.9** Create `internal/repository/postgres/dnc_repo.go` — implement `DNCRepository`
- [ ] **2.2.10** `IsBlocked` — `SELECT EXISTS(SELECT 1 FROM dnc_list WHERE user_id = $1 AND phone = $2)`

**Refs:** SDD §5.1, database-schema.md §10, §22

### 2.3 — Database Connection

- [ ] **2.3.1** Create connection pool factory: `NewPool(ctx, databaseURL) (*pgxpool.Pool, error)` with configurable max connections, min connections, connection lifetime
- [ ] **2.3.2** Set pool defaults: maxConns=20, minConns=2, maxConnLifetime=1h, maxConnIdleTime=30m
- [ ] **2.3.3** Verify connection on startup with `pool.Ping(ctx)` — fail fast if DB unreachable
- [ ] **2.3.4** Graceful shutdown: close pool on SIGTERM/SIGINT

**Refs:** SDD §5.1

---

## Phase 3 — Redis Queue

### 3.1 — Redis Connection

- [ ] **3.1.1** Create `internal/queue/redis_queue.go` — `RedisQueue` struct with `redis.Client`
- [ ] **3.1.2** Initialize Redis client from `REDIS_URL` with connection pooling (pool_size=50, min_idle=10)
- [ ] **3.1.3** Verify connection on startup with `client.Ping(ctx)` — fail fast if Redis unreachable
- [ ] **3.1.4** Graceful shutdown: close Redis client

**Refs:** SDD §4.1, SDD §9

### 3.2 — Queue Operations

- [ ] **3.2.1** Implement `Enqueue(ctx, campaignID string, contacts []domain.CampaignContact)` — push each contact ID onto a Redis list: `LPUSH dialer:campaign:{campaignID}:queue <contactID1> <contactID2> ...`
- [ ] **3.2.2** Implement `Dequeue(ctx, campaignID string) (*domain.CampaignContact, error)` — `BRPOP dialer:campaign:{campaignID}:queue` with 5-second timeout, fetch full contact from DB by ID (Redis stores IDs only, DB is source of truth)
- [ ] **3.2.3** Implement `QueueLength(ctx, campaignID string) (int64, error)` — `LLEN dialer:campaign:{campaignID}:queue`
- [ ] **3.2.4** Implement `ClearQueue(ctx, campaignID string)` — `DEL dialer:campaign:{campaignID}:queue` (on campaign stop)
- [ ] **3.2.5** Create `internal/queue/memory_queue.go` — in-memory `MemoryQueue` implementing same interface for unit tests (uses a Go channel internally)

**Refs:** SDD §4.2, SDD §9 (Redis caching)

### 3.3 — Campaign State in Redis

- [ ] **3.3.1** Store campaign control flags: `SET dialer:campaign:{campaignID}:state running|paused|stopped` — checked by worker loop on each iteration
- [ ] **3.3.2** Store progress counters: `HSET dialer:campaign:{campaignID}:progress dialed 0 answered 0 failed 0 busy 0 no_answer 0 remaining 842` — periodically synced to DB
- [ ] **3.3.3** TTL: set campaign Redis keys to expire 24h after campaign completion

**Refs:** SDD §9 (campaign progress counters)

---

## Phase 4 — Telephony Provider Abstraction

### 4.1 — Go Provider Interface

- [ ] **4.1.1** Create `internal/dialer/provider.go` — define `TelephonyProvider` Go interface:
  ```go
  type TelephonyProvider interface {
      Name() string
      Call(ctx context.Context, to string, from string, opts CallOptions) (*CallResult, error)
      ValidateWebhookSignature(payload []byte, signature string) bool
  }
  ```
- [ ] **4.1.2** Define `CallOptions` struct: `Timeout time.Duration`, `Record bool`, `RecordDisclosure bool`, `VoicemailDropURL string`, `StatusCallbackURL string`
- [ ] **4.1.3** Define `CallResult` struct: `ProviderCallSid string`, `Status string`, `DurationSeconds int`, `ErrorMessage string`
- [ ] **4.1.4** Create `internal/dialer/provider_factory.go` — `NewProvider(name string, cfg config.Config) (TelephonyProvider, error)` — factory switch on `TELEPHONY_PROVIDER` env var

**Refs:** PAL §3, PAL §4.3

### 4.2 — Twilio Client (Active Implementation)

- [ ] **4.2.1** Create `internal/dialer/twilio_client.go` — `TwilioClient` struct implementing `TelephonyProvider`
- [ ] **4.2.2** Initialize Twilio REST client with account SID + auth token from config
- [ ] **4.2.3** Implement `Call(ctx, to, from, opts)` — use Twilio Go SDK `client.Calls.Create()` to initiate outbound PSTN call:
  - Set `Url` to TwiML endpoint that bridges to the agent/voicemail-drop
  - Set `StatusCallback` to NestJS webhook URL for CDR updates
  - Set `Record` flag if call recording enabled
  - Return `CallResult` with `ProviderCallSid` and initial status
- [ ] **4.2.4** Handle Twilio API errors gracefully — classify into domain errors (busy, no-answer, invalid number, rate-limited)
- [ ] **4.2.5** Implement `ValidateWebhookSignature` — verify X-Twilio-Signature header (used if Go receives direct webhooks)
- [ ] **4.2.6** Set reasonable timeouts: 30s call setup timeout via context

**Refs:** PAL §3, PAL §10 capability matrix, SDD §4.2

### 4.3 — Stub Providers

- [ ] **4.3.1** Create `internal/dialer/stub_clients.go` — `VonageClient`, `BandwidthClient`, `PlivoClient`, `TelnyxClient` — each returns `ErrNotImplemented` for all methods
- [ ] **4.3.2** Register all stubs in the provider factory

**Refs:** PAL §11 (Phase 1 — stubs)

### 4.4 — Call Outcome Classification

- [ ] **4.4.1** Create `internal/dialer/call_outcome.go` — map Twilio call status strings to VoiceLink `ContactStatus` enums:
  - `completed` → `answered`
  - `no-answer` → `no-answer`
  - `busy` → `busy`
  - `failed`, `canceled` → `failed`
- [ ] **4.4.2** Implement `ClassifyOutcome(result CallResult) domain.ContactStatus`

**Refs:** PAL §6.2 (call status normalization)

### 4.5 — Voicemail Drop

- [ ] **4.5.1** Create `internal/dialer/voicemail_drop.go` — when campaign has `voicemailDropUrl`, generate TwiML that plays the recording after no-answer detection
- [ ] **4.5.2** Implement `GenerateVoicemailDropTwiML(audioURL string) string` — produce `<Play>` TwiML verb
- [ ] **4.5.3** Integrate with `TwilioClient.Call()`: if `VoicemailDropURL` is set, use answering machine detection (`MachineDetection: 'DetectMessageEnd'`) and supply voicemail TwiML URL

**Refs:** FR-PD-12, SRS §3.5

---

## Phase 5 — Worker Pool (Core Engine)

> **This is the heart of the dialer.** The worker pool manages concurrent outbound calls using a channel-based semaphore.

### 5.1 — Worker Pool Implementation

- [ ] **5.1.1** Create `internal/campaign/worker_pool.go` — `WorkerPool` struct:
  ```go
  type WorkerPool struct {
      semaphore chan struct{}          // buffered channel = max concurrency
      campaign  *domain.Campaign
      queue     queue.ContactQueue
      dialer    dialer.TelephonyProvider
      repo      repository.CampaignRepository
      contactRepo repository.ContactRepository
      dncRepo   repository.DNCRepository
      callback  callback.Client
      logger    *zap.Logger
      results   chan domain.CallResult
      done      chan struct{}
      mu        sync.RWMutex
      state     CampaignState         // running | paused | stopped
  }
  ```
- [ ] **5.1.2** Implement `NewWorkerPool(...)` — constructor, buffer semaphore to `campaign.Concurrency` size (1–10 per FR-PD-04)
- [ ] **5.1.3** Implement `Start(ctx context.Context)` — the main loop:
  1. Check Redis state flag — if `paused`, sleep 1s and recheck; if `stopped`, exit
  2. Check calling hours (Phase 7) — if outside window, sleep until next window
  3. `Dequeue` next contact from Redis queue (blocks with timeout)
  4. If queue empty → all contacts processed, transition to `completed`, return
  5. Acquire semaphore slot (`wp.semaphore <- struct{}{}`)
  6. Launch goroutine to dial: `go wp.dialOne(ctx, contact)`
  7. If `delaySeconds > 0`, sleep between dequeues (not between semaphore releases)
- [ ] **5.1.4** Implement `dialOne(ctx, contact)` — dial subroutine:
  1. `defer func() { <-wp.semaphore }()` — release slot when done
  2. Check DNC list — if blocked, mark `dnc`, update DB, send progress callback, return
  3. Mark contact status `dialing` in DB
  4. Call `wp.dialer.Call(ctx, contact.Phone, wp.campaign.FromNumber, opts)`
  5. Classify outcome via `call_outcome.go`
  6. Update contact status + attempts + call_duration in DB
  7. Update Redis progress counters
  8. Send result to `wp.results` channel
  9. Every 5 dials → send progress callback to NestJS
- [ ] **5.1.5** Implement `Pause()` — set Redis state flag to `paused`, cancel active context (workers finish current dial then block on semaphore)
- [ ] **5.1.6** Implement `Resume()` — set Redis state flag to `running`, start a new `Start()` goroutine
- [ ] **5.1.7** Implement `Stop()` — set Redis state flag to `stopped`, cancel context, drain remaining queue items back to `pending` status
- [ ] **5.1.8** Implement `Progress() CampaignProgress` — read counters from Redis, return `{dialed, answered, failed, busy, noAnswer, remaining}`

**Refs:** SDD §4.2 (exact worker pool code reference), FR-PD-04 through FR-PD-08, FR-PD-13

### 5.2 — Retry Logic

- [ ] **5.2.1** Create `internal/campaign/retry.go` — `ShouldRetry(contact domain.CampaignContact, campaign domain.Campaign) bool`
- [ ] **5.2.2** Retry only `no-answer` and `busy` statuses — do NOT retry `failed` or `dnc`
- [ ] **5.2.3** Check `contact.Attempts < campaign.RetryMax + 1` (first attempt + N retries)
- [ ] **5.2.4** Implement exponential backoff between retries: 30s, 60s, 120s — re-enqueue with delay via Redis `ZADD` with score = `now + delay`
- [ ] **5.2.5** For scheduled retries: use a Redis sorted set `dialer:campaign:{campaignID}:retry` checked periodically by the worker loop

**Refs:** FR-PD-13, SDD §4.2

---

## Phase 6 — Campaign Service (Orchestration Layer)

### 6.1 — Service Implementation

- [ ] **6.1.1** Create `internal/campaign/service.go` — `Service` struct orchestrating all campaign operations
- [ ] **6.1.2** Implement `CreateAndStart(ctx, input CreateCampaignInput) (*domain.Campaign, error)`:
  1. Validate input (name non-empty, fromNumber E.164, concurrency 1–10, delay 0–60)
  2. Parse CSV contacts from input
  3. Insert campaign row via repository
  4. Bulk insert campaign_contacts via `CopyFrom`
  5. Enqueue all contact IDs into Redis
  6. Set Redis state flag to `running`
  7. Create WorkerPool and call `go pool.Start(ctx)`
  8. Store pool reference in in-memory map `map[campaignID]*WorkerPool`
  9. Return campaign
- [ ] **6.1.3** Implement `GetCampaign(ctx, campaignID string) (*domain.Campaign, error)` — fetch from DB, enrich with live progress from Redis if running
- [ ] **6.1.4** Implement `PauseCampaign(ctx, campaignID string)` — validate user owns campaign, validate state transition, call `pool.Pause()`, update DB status to `paused`
- [ ] **6.1.5** Implement `ResumeCampaign(ctx, campaignID string)` — validate, call `pool.Resume()`, update DB to `running`
- [ ] **6.1.6** Implement `StopCampaign(ctx, campaignID string)` — validate transition (cannot restart stopped), call `pool.Stop()`, clear Redis queue, update DB status to `stopped`, finalize counters
- [ ] **6.1.7** Implement `GetResults(ctx, campaignID, page, limit)` — paginated query of `campaign_contacts` for campaign
- [ ] **6.1.8** Implement `ExportCSV(ctx, campaignID string) ([]byte, error)` — generate CSV with columns: phone, name, notes, status, attempts, call_duration, last_attempted_at

**Refs:** SDD §4.2, §4.3, FR-PD-01 through FR-PD-09

### 6.2 — In-Memory Pool Registry

- [ ] **6.2.1** Create thread-safe `PoolRegistry` — `sync.RWMutex` protected `map[string]*WorkerPool` — enables pause/resume/stop by campaign ID
- [ ] **6.2.2** On service startup (crash recovery): query DB for campaigns with `status = 'running'` or `'paused'`, offer admin endpoint to resume or reset them — do NOT auto-resume (safety first)

**Refs:** SDD §4.3

---

## Phase 7 — Calling Hours & DNC Enforcement

### 7.1 — Calling Hours Gate

- [ ] **7.1.1** Create `internal/campaign/calling_hours.go` — `IsWithinCallingHours(campaign domain.Campaign, now time.Time) bool`
- [ ] **7.1.2** Load timezone location from `campaign.CallingHoursTimezone` IANA string (e.g., `America/New_York`)
- [ ] **7.1.3** Convert `now` to campaign timezone, check if time is between `callingHoursStart` and `callingHoursEnd`
- [ ] **7.1.4** If outside window, calculate sleep duration until next window start, return to worker loop
- [ ] **7.1.5** Worker loop: if outside calling hours, log, sleep until window open (with periodic Redis state checks)

**Refs:** FR-PD-14, TCPA compliance, SRS §8.1

### 7.2 — DNC Enforcement

- [ ] **7.2.1** Before dialing each contact, call `dncRepo.IsBlocked(ctx, campaign.UserID, contact.Phone)`
- [ ] **7.2.2** If blocked: mark contact status `dnc`, log reason from DNC entry, skip dial
- [ ] **7.2.3** Support DNC auto-add on campaign opt-out: if contact replies STOP to campaign SMS, add to DNC via `source = 'campaign_opt_out'`

**Refs:** FR-PD-11, SRS §3.5, database-schema.md §22

---

## Phase 8 — API Layer (Echo HTTP Handlers)

### 8.1 — Router Setup

- [ ] **8.1.1** Create `internal/api/router.go` — `NewRouter(service, cfg) *echo.Echo`:
  - Set up Echo with production defaults: `HideBanner=true`, `HidePort=true`
  - Register global middleware: `Recover()`, `RequestID()`, `Logging()`, `CORS()`
  - Register route groups and handlers
  - Return configured Echo instance
- [ ] **8.1.2** Group routes: all campaign routes under `/campaigns` with auth middleware; `/health` without auth

**Refs:** SDD §4.3

### 8.2 — Middleware

- [ ] **8.2.1** Create `internal/api/middleware/auth.go` — `AuthMiddleware(cfg)` — validate `Authorization: Bearer <INTERNAL_API_KEY>` header, reject 401 if missing/invalid
- [ ] **8.2.2** Create `internal/api/middleware/logging.go` — `LoggingMiddleware(logger)` — log method, path, status, duration, request ID using zap
- [ ] **8.2.3** Create `internal/api/middleware/requestid.go` — ensure every request has `X-Request-ID` (generate UUID if not provided), propagate via context
- [ ] **8.2.4** Echo's built-in `Recover()` middleware handles panics — configure custom panic handler that logs stack trace via zap

**Refs:** SDD §4.1

### 8.3 — DTOs

- [ ] **8.3.1** Create `internal/api/dto/request.go`:
  ```go
  type CreateCampaignRequest struct {
      Name                string `json:"name" validate:"required,min=1,max=255"`
      UserID              string `json:"userId" validate:"required,uuid"`
      FromNumber          string `json:"fromNumber" validate:"required,e164"`
      Concurrency         int    `json:"concurrency" validate:"min=1,max=10"`
      DelaySeconds        int    `json:"delaySeconds" validate:"min=0,max=60"`
      RetryMax            int    `json:"retryMax" validate:"min=0,max=3"`
      VoicemailDropURL    string `json:"voicemailDropUrl"`
      CallingHoursStart   string `json:"callingHoursStart"`   // "09:00"
      CallingHoursEnd     string `json:"callingHoursEnd"`     // "17:00"
      CallingHoursTimezone string `json:"callingHoursTimezone"` // IANA
      ScheduledAt         string `json:"scheduledAt"`          // ISO 8601 or null
      Contacts            []ContactCSVRow `json:"contacts" validate:"required,min=1,max=100000"`
  }
  type ContactCSVRow struct {
      Phone string `json:"phone" validate:"required,e164"`
      Name  string `json:"name"`
      Notes string `json:"notes"`
  }
  ```
- [ ] **8.3.2** Create `internal/api/dto/response.go` — standardized response envelope: `{ "success": bool, "data": any, "error": { "code": string, "message": string } }` matching NestJS format per SDD §10.1
- [ ] **8.3.3** Create helper functions: `SuccessResponse(c, data)`, `ErrorResponse(c, code, message)`, `PaginatedResponse(c, data, page, limit, total)`

**Refs:** API.md §Power Dialer, SDD §10.1

### 8.4 — Campaign Handlers

- [ ] **8.4.1** Create `internal/api/handler/campaign_handler.go` — `CampaignHandler` struct with `campaign.Service` dependency
- [ ] **8.4.2** `POST /campaigns` — create and start campaign:
  1. Bind & validate request body
  2. Call `service.CreateAndStart(ctx, input)`
  3. Return 201 with campaign object
- [ ] **8.4.3** `GET /campaigns/:id` — get campaign status + live progress from Redis
- [ ] **8.4.4** `POST /campaigns/:id/pause` — call `service.PauseCampaign(ctx, id)`, return updated status
- [ ] **8.4.5** `POST /campaigns/:id/resume` — call `service.ResumeCampaign(ctx, id)`, return updated status
- [ ] **8.4.6** `POST /campaigns/:id/stop` — call `service.StopCampaign(ctx, id)`, return final counters
- [ ] **8.4.7** `GET /campaigns/:id/results` — paginated results from `service.GetResults(ctx, id, page, limit)`
- [ ] **8.4.8** `GET /campaigns/:id/export` — CSV file download from `service.ExportCSV(ctx, id)`, set `Content-Type: text/csv`, `Content-Disposition: attachment`

**Refs:** SDD §4.3, API §Power Dialer

### 8.5 — Health Handler

- [ ] **8.5.1** Create `internal/api/handler/health_handler.go` — `GET /health` returns:
  ```json
  { "status": "ok", "db": "connected", "redis": "connected", "provider": "twilio" }
  ```
- [ ] **8.5.2** Actually ping DB (`pool.Ping`) and Redis (`client.Ping`) — if either fails, return 503

**Refs:** SDD §4.3, backend-tasks.md §16.3

---

## Phase 9 — Progress Callbacks to NestJS

### 9.1 — Callback Client

- [ ] **9.1.1** Create `internal/callback/client.go` — `CallbackClient` struct:
  ```go
  type CallbackClient struct {
      baseURL    string
      apiKey     string
      httpClient *http.Client
      logger     *zap.Logger
  }
  ```
- [ ] **9.1.2** Configure HTTP client with timeout (10s), keep-alive, retry (3 attempts with backoff)
- [ ] **9.1.3** Implement `SendProgress(ctx, campaignID string, progress CampaignProgress)` — POST to `{NESTJS_CALLBACK_URL}/internal/dialer/callback` with JSON body:
  ```json
  { "campaignId": "uuid", "dialed": 50, "answered": 20, "failed": 3, "busy": 2, "noAnswer": 5, "remaining": 770 }
  ```
- [ ] **9.1.4** Implement `SendCompleted(ctx, campaignID string, summary CampaignSummary)` — final callback with complete counters when campaign finishes
- [ ] **9.1.5** Handle callback failures: log error, do NOT retry indefinitely (3 attempts), do NOT block dialing — callbacks are fire-and-forget, not transactional
- [ ] **9.1.6** Set `Authorization: Bearer {INTERNAL_API_KEY}` and `Content-Type: application/json` headers

**Refs:** SDD §4.4, backend-tasks.md §8.4

---

## Phase 10 — CSV Parsing & Validation

### 10.1 — CSV Parser

- [ ] **10.1.1** Create `internal/campaign/csv_parser.go` — `ParseCSV(reader io.Reader) ([]dto.ContactCSVRow, *ValidationReport, error)`
- [ ] **10.1.2** Detect phone column (case-insensitive header matching: `phone`, `phonenumber`, `number`, `mobile`, `tel`)
- [ ] **10.1.3** Parse rows, validate each phone against E.164 regex (`^\+?[1-9]\d{1,14}$`)
- [ ] **10.1.4** Track valid/invalid rows — return `ValidationReport` with: `Total`, `Valid`, `Invalid` counts and `[]InvalidRow{Row int, Phone string, Reason string}`
- [ ] **10.1.5** Reject files with 0 valid rows as error
- [ ] **10.1.6** Support optional columns: `name`, `notes` — include if present, ignore unknown columns
- [ ] **10.1.7** Enforce max 100,000 contacts per campaign (NFR-PERF-06)

**Refs:** FR-PD-01, FR-PD-02, FR-PD-03, SRS §3.5

---

## Phase 11 — Main Entry Point & Lifecycle

### 11.1 — main.go

- [ ] **11.1.1** Create `cmd/server/main.go`:
  1. Load `.env` file via godotenv (dev only — in production, env vars are injected)
  2. Parse config via `caarlos0/env`
  3. Initialize structured logger (zap)
  4. Create PostgreSQL connection pool, verify with ping
  5. Create Redis client, verify with ping
  6. Initialize Twilio provider via factory
  7. Initialize repositories (postgres implementations)
  8. Initialize campaign service with all dependencies
  9. Initialize callback client
  10. Recover stale campaigns (log, don't auto-resume)
  11. Create Echo router, register middleware and handlers
  12. Start HTTP server in goroutine
  13. Listen for SIGINT/SIGTERM — graceful shutdown with 30s timeout
  14. On shutdown: stop all running worker pools, close DB pool, close Redis, flush logs
- [ ] **11.1.2** Order of shutdown: HTTP server → worker pools → Redis → PostgreSQL → logger sync

**Refs:** SDD §4.1, best practice for Go services

### 11.2 — Makefile

- [ ] **11.2.1** Create `Makefile` with targets:
  - `build` — `go build -o bin/dialer cmd/server/main.go`
  - `run` — `go run cmd/server/main.go`
  - `test` — `go test ./... -race -cover`
  - `lint` — `golangci-lint run`
  - `fmt` — `go fmt ./...`
  - `docker-build` — `docker build -t voicelink-dialer .`
  - `migrate-up` — run DB migrations
  - `generate` — `go generate ./...`

---

## Phase 12 — Testing

### 12.1 — Unit Tests

- [ ] **12.1.1** `lifecycle_test.go` — test every valid and invalid state transition permutation
- [ ] **12.1.2** `csv_parser_test.go` — valid CSV, missing phone column, invalid numbers, empty file, 100k boundary, mixed valid/invalid rows
- [ ] **12.1.3** `worker_pool_test.go` — test with `MemoryQueue` and mock dialer:
  - Workers process all contacts
  - Semaphore limits concurrency to configured max
  - Pause stops dequeuing
  - Resume continues
  - Stop drains and terminates
  - DNC numbers are skipped
  - Retry re-enqueues failed contacts
  - Calling hours gate blocks outside window
- [ ] **12.1.4** `service_test.go` — create campaign with mocked repos, pause/resume/stop with mocked pool
- [ ] **12.1.5** `twilio_client_test.go` — mock Twilio HTTP responses, test outcome classification for all statuses
- [ ] **12.1.6** `redis_queue_test.go` — enqueue, dequeue, empty queue behavior, concurrent dequeues
- [ ] **12.1.7** `campaign_repo_test.go` — CRUD, atomic counter updates, `FOR UPDATE SKIP LOCKED` behavior
- [ ] **12.1.8** `retry_test.go` — should retry for no-answer/busy, shouldn't for dnc/failed, respects max attempts

### 12.2 — Integration Tests

- [ ] **12.2.1** Full campaign lifecycle: create → start → dials N contacts (mock provider) → progress callbacks sent → pause → resume → stop → export CSV
- [ ] **12.2.2** Concurrent campaigns: two campaigns from different users run simultaneously without interference
- [ ] **12.2.3** Crash recovery: campaign in `running` state on startup is detected (not auto-resumed)
- [ ] **12.2.4** Database constraint: duplicate campaign stop is rejected
- [ ] **12.2.5** Large campaign: 10,000 contacts enqueued and dequeued within 30 seconds

### 12.3 — Test Infrastructure

- [ ] **12.3.1** Use `testcontainers-go` for PostgreSQL and Redis in integration tests (or docker-compose test profile)
- [ ] **12.3.2** Create `test/testutil/db.go` — helper to create test DB, run migrations, truncate between tests
- [ ] **12.3.3** Create `test/testutil/redis.go` — helper to create test Redis, flush between tests
- [ ] **12.3.4** Create test fixtures: `valid_contacts.csv` (100 rows), `invalid_contacts.csv` (mixed valid/invalid)

**Refs:** SDD §4 (testing best practices)

---

## Phase 13 — Docker & Deployment

### 13.1 — Dockerfile

- [ ] **13.1.1** Create multi-stage `Dockerfile`:
  - Stage 1 (build): `golang:1.22-alpine` — compile binary with `CGO_ENABLED=0`, strip symbols
  - Stage 2 (run): `alpine:3.19` — copy binary, add ca-certificates, set `USER 1000`
  - `EXPOSE 8080`
  - `HEALTHCHECK --interval=30s CMD wget -qO- http://localhost:8080/health || exit 1`
  - `ENTRYPOINT ["./dialer"]`
- [ ] **13.1.2** Verify image size < 20MB (Go static binary on Alpine)

**Refs:** SDD §8.1, backend-tasks.md §16

### 13.2 — Docker Compose

- [ ] **13.2.1** Wire into root `docker-compose.yml` per SDD §8.1:
  ```yaml
  dialer:
    build: ./dialer-service
    ports: ['8080:8080']
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      - PORT=8080
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/voicelink
      - REDIS_URL=redis://redis:6379
      - TELEPHONY_PROVIDER=twilio
      - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
      - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
      - NESTJS_CALLBACK_URL=http://api:4000
      - INTERNAL_API_KEY=${INTERNAL_API_KEY}
    restart: unless-stopped
  ```

**Refs:** SDD §8.1

---

## Task Summary

| Phase | Description | # Tasks | Priority |
|-------|-------------|---------|----------|
| 0 — Foundation | Go module, dependencies, config, logging | 10 | Blocker |
| 1 — Domain Models | Entities, status enums, state machine, errors | 9 | Blocker |
| 2 — Repository | Interfaces + pgx implementations | 13 | Blocker |
| 3 — Redis Queue | Connection, queue ops, campaign state | 9 | Blocker |
| 4 — Provider Abstraction | Go interface, Twilio client, stubs, outcome classification, voicemail drop | 15 | Critical |
| 5 — Worker Pool | Semaphore pool, dial loop, retry logic | 13 | Critical |
| 6 — Campaign Service | Orchestration, lifecycle, pool registry, results/export | 10 | Critical |
| 7 — Calling Hours & DNC | Timezone gate, DNC check, compliance | 7 | High |
| 8 — API Layer | Echo router, middleware, DTOs, handlers | 16 | Critical |
| 9 — Progress Callbacks | HTTP client to NestJS, fire-and-forget | 6 | High |
| 10 — CSV Parsing | Parse, validate, E.164 check, validation report | 7 | High |
| 11 — Main & Lifecycle | Entry point, graceful shutdown, Makefile | 5 | Blocker |
| 12 — Testing | 8 unit + 5 integration + test infra | 16 | Per-phase |
| 13 — Docker & Deploy | Multi-stage Dockerfile, compose wiring | 3 | Deployment |

**Total: ~139 tasks**

---

## How NestJS Calls the Go Dialer

```
NestJS DialerService
    │
    ├── POST http://dialer:8080/campaigns          (create & start)
    │    Body: { name, userId, fromNumber, concurrency, delaySeconds,
    │            retryMax, voicemailDropUrl, callingHours*, scheduledAt,
    │            contacts: [{phone, name, notes}, ...] }
    │    Response: 201 { campaign }
    │
    ├── GET  http://dialer:8080/campaigns/:id       (get status + progress)
    ├── POST http://dialer:8080/campaigns/:id/pause
    ├── POST http://dialer:8080/campaigns/:id/resume
    ├── POST http://dialer:8080/campaigns/:id/stop
    ├── GET  http://dialer:8080/campaigns/:id/results?page=1&limit=50
    └── GET  http://dialer:8080/campaigns/:id/export → CSV download

Go Dialer → NestJS
    │
    └── POST http://api:4000/internal/dialer/callback
         Body: { campaignId, dialed, answered, failed, busy, noAnswer, remaining }
         Headers: Authorization: Bearer {INTERNAL_API_KEY}
```

---

*Generated from SDD §4, SRS §3.5, PAL §1–12, URD Use Cases, API Reference, database-schema.md*
