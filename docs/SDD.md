# System Design Document (SDD)
## VoiceLink — Architecture & Technical Design

| Field | Detail |
|---|---|
| Document Version | 1.1 |
| Stack | Next.js 14 · NestJS 10 · Go 1.22 (Echo) |
| Database | PostgreSQL 15 · Redis 7 |
| Telephony | Provider-agnostic via PAL (Twilio active in v1) |

> **Note:** This document incorporates the Telephony Provider Abstraction Layer (PAL) addendum (v1.0). All Twilio-specific references in the original v1.0 SDD have been replaced with provider-neutral equivalents per that document's §12 change table.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Frontend Architecture (Next.js)](#2-frontend-architecture-nextjs)
3. [Backend Architecture (NestJS)](#3-backend-architecture-nestjs)
4. [Power Dialer Service (Go Echo)](#4-power-dialer-service-go-echo)
5. [Database Design](#5-database-design)
6. [Real-Time Communication](#6-real-time-communication)
7. [Telephony Integration](#7-telephony-integration)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Caching Strategy](#9-caching-strategy)
10. [API Design Standards](#10-api-design-standards)

---

## 1. Architecture Overview

VoiceLink uses a microservice-adjacent architecture with three main compute layers:

```
                        ┌─────────────────────┐
                        │   Cloudflare CDN    │
                        │  (Static Assets +   │
                        │   DDoS Protection)  │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Next.js Frontend  │
                        │  (Vercel / Docker)  │
                        └──────────┬──────────┘
                    HTTPS │              │ WSS
                          │              │
              ┌───────────▼──────────────▼────────────┐
              │           NestJS API Service           │
              │                                        │
              │  AuthModule  │  MessagingModule         │
              │  CallingModule │ NumbersModule          │
              │  DialerModule │ BillingModule           │
              └───┬──────┬───────────────┬─────────────┘
                  │      │               │
          ┌───────▼─┐  ┌─▼──────┐  ┌────▼──────────────┐
          │Postgres │  │ Redis  │  │  Go Echo Service  │
          │   DB    │  │(cache/ │  │  (Power Dialer)   │
          └─────────┘  │ queue) │  └────────────────────┘
                       └────────┘
                          │
              ┌───────────▼──────────────────────────────┐
              │    Telephony Provider Abstraction Layer   │
              │  (TwilioProvider active — Vonage, Band-   │
              │   width, Plivo, Telnyx as stubs in v1)    │
              └──────────────────────────────────────────┘
```

### Service Responsibilities

| Service | Language | Responsibility |
|---|---|---|
| Next.js Frontend | TypeScript | UI, WebRTC client, SSR |
| NestJS API | TypeScript | Business logic, auth, orchestration |
| Go Echo (Dialer) | Go | Power dialer worker pool, campaign execution |
| PostgreSQL | — | Primary persistent data store |
| Redis | — | Session cache, WebSocket state, job queues |

---

## 2. Frontend Architecture (Next.js)

### 2.1 Directory Structure

```
/frontend
├── app/                          # Next.js 14 App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx            # Sidebar + WebSocket provider
│   │   ├── messages/
│   │   │   ├── page.tsx          # Conversation list
│   │   │   └── [id]/page.tsx     # Individual conversation
│   │   ├── calls/
│   │   │   ├── page.tsx          # Call history
│   │   │   └── dialpad/page.tsx
│   │   ├── dialer/
│   │   │   ├── page.tsx          # Campaign list
│   │   │   └── [id]/page.tsx     # Campaign live view
│   │   ├── numbers/page.tsx
│   │   └── settings/page.tsx
├── components/
│   ├── calling/
│   │   ├── DialPad.tsx
│   │   ├── InboundCallOverlay.tsx
│   │   ├── ActiveCallBar.tsx
│   │   └── VoicemailPlayer.tsx
│   ├── messaging/
│   │   ├── ConversationList.tsx
│   │   ├── MessageThread.tsx
│   │   └── MessageInput.tsx
│   ├── dialer/
│   │   ├── CampaignForm.tsx
│   │   ├── CampaignDashboard.tsx
│   │   └── CsvUploader.tsx
│   └── ui/                       # Shared components (shadcn/ui base)
├── lib/
│   ├── api.ts                    # Axios instance with interceptors
│   ├── websocket.ts              # WebSocket client manager
│   ├── webrtc.ts                 # Provider-agnostic WebRTC client wrapper
│   └── types.ts                  # Shared TypeScript types
├── store/
│   ├── authStore.ts              # Zustand auth state
│   ├── callStore.ts              # Active call state
│   └── messageStore.ts           # Message cache
└── hooks/
    ├── useWebSocket.ts
    ├── useInboundCall.ts
    └── useCampaignProgress.ts
```

### 2.2 State Management

- **Zustand** for global client state (auth, active call, active campaign)
- **TanStack Query (React Query)** for server state, caching, and background sync
- **WebSocket** for real-time updates (new messages, call events, campaign progress)

### 2.3 WebRTC Integration

The frontend does **not** import any telephony provider SDK directly. Instead, `lib/webrtc.ts` implements a provider-agnostic `WebRTCClient` wrapper. The active provider is determined from the `provider` field returned by `GET /calls/token`, and the appropriate SDK is loaded at runtime.

```typescript
// lib/webrtc.ts

export async function initializeCallClient(tokenResponse: { token: string; provider: string }) {
  switch (tokenResponse.provider) {
    case 'twilio':
      return initTwilioDevice(tokenResponse.token);
    case 'vonage':
      return initVonageClient(tokenResponse.token);
    case 'bandwidth':
      return initBandwidthClient(tokenResponse.token);
    default:
      throw new Error(`Unsupported WebRTC provider: ${tokenResponse.provider}`);
  }
}

// Internal — Twilio implementation (v1 active)
async function initTwilioDevice(token: string) {
  const { Device } = await import('@twilio/voice-sdk');
  const device = new Device(token, {
    codecPreferences: ['opus', 'pcmu'],
    enableDscp: true,
  });
  device.on('incoming', (call) => {
    useCallStore.getState().setIncomingCall(call);
  });
  await device.register();
  return device;
}
```

### 2.4 Rendering Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/login`, `/register` | SSR | SEO, fast first paint |
| `/messages` | CSR with SWR | Real-time data, no SEO needed |
| `/calls` | CSR | Dynamic content |
| `/dialer` | CSR | Live updates |
| `/numbers` | SSR + CSR hydration | Semi-static + user data |

---

## 3. Backend Architecture (NestJS)

### 3.1 Directory Structure

```
/backend
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   └── google.strategy.ts
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── messaging/
│   │   ├── messaging.module.ts
│   │   ├── messaging.controller.ts   # REST endpoints
│   │   ├── messaging.gateway.ts      # WebSocket gateway
│   │   ├── messaging.service.ts
│   │   └── dto/
│   ├── calling/
│   │   ├── calling.module.ts
│   │   ├── calling.controller.ts
│   │   ├── calling.gateway.ts
│   │   ├── calling.service.ts
│   │   └── webhooks/
│   │       ├── voice-webhook.controller.ts
│   │       └── status-callback.controller.ts
│   ├── numbers/
│   │   ├── numbers.module.ts
│   │   ├── numbers.controller.ts
│   │   └── numbers.service.ts
│   ├── dialer/
│   │   ├── dialer.module.ts
│   │   ├── dialer.controller.ts
│   │   └── dialer.service.ts        # Calls Go Echo service
│   ├── billing/
│   │   ├── billing.module.ts
│   │   ├── billing.controller.ts
│   │   ├── billing.service.ts
│   │   └── webhooks/stripe-webhook.controller.ts
│   ├── contacts/
│   ├── telephony/
│   │   ├── telephony.module.ts           # Provider factory + DI
│   │   ├── interfaces/
│   │   │   └── telephony-provider.interface.ts
│   │   ├── providers/
│   │   │   ├── twilio.provider.ts        # Active implementation
│   │   │   ├── vonage.provider.ts        # Stub
│   │   │   ├── bandwidth.provider.ts     # Stub
│   │   │   ├── plivo.provider.ts         # Stub
│   │   │   └── telnyx.provider.ts        # Stub
│   │   └── status-maps/
│   │       ├── twilio.json
│   │       ├── vonage.json
│   │       └── bandwidth.json
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── decorators/
│   │       └── current-user.decorator.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── telephony.config.ts           # Replaces twilio.config.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/
    ├── unit/
    └── e2e/
```

### 3.2 Module Design

Each module follows NestJS conventions strictly:

```
Module = Controller (routes) + Service (logic) + Repository (data)
```

All telephony operations go through `TELEPHONY_PROVIDER` injected from `TelephonyModule`. Services never import a provider SDK directly.

**Messaging flow example:**

```
POST /api/v1/messages
  → MessagingController.send()
    → MessagingService.sendMessage()
      → validate recipient number (E.164)
      → check user quota (Redis)
      → call TelephonyProvider.sendMessage()
      → persist message to PostgreSQL
      → emit WebSocket event via MessagingGateway
      → return 201 with message object
```

### 3.3 WebSocket Gateway

```typescript
@WebSocketGateway({ namespace: '/ws', cors: true })
export class MessagingGateway {
  @WebSocketServer() server: Server;

  // Called by MessagingService when inbound SMS arrives
  emitNewMessage(userId: string, message: Message) {
    this.server.to(`user:${userId}`).emit('message:new', message);
  }

  // Called by CallingService for inbound call
  emitInboundCall(userId: string, callData: InboundCallDto) {
    this.server.to(`user:${userId}`).emit('call:inbound', callData);
  }
}
```

### 3.4 Webhook Security (Provider-Agnostic)

All inbound webhooks are validated using the active provider's signature verification before reaching business logic. The webhook controller selects the correct provider implementation via the `:provider` path segment:

```typescript
@Post(':provider/voice')
async handleInboundCall(
  @Param('provider') providerName: string,
  @Req() req: RawWebhookRequest,
) {
  const provider = this.telephonyRegistry.get(providerName);
  if (!provider.validateWebhookSignature(req)) {
    throw new ForbiddenException('Invalid webhook signature');
  }
  const normalized = provider.parseInboundCallWebhook(req);
  // ... business logic operates on normalized shape ...
  return provider.generateCallControlResponse({ type: 'dial-client', clientId: user.id });
}
```

Webhook URLs follow the pattern:

```
POST /webhooks/:provider/voice
POST /webhooks/:provider/voice/status
POST /webhooks/:provider/sms
POST /webhooks/:provider/sms/status
```

This routing keeps URLs stable across provider switches and enables multiple providers to run concurrently during migration windows.

---

## 4. Power Dialer Service (Go Echo)

### 4.1 Directory Structure

```
/dialer-service
├── main.go
├── cmd/
│   └── server/main.go
├── internal/
│   ├── api/
│   │   ├── handler.go           # Echo route handlers
│   │   └── middleware.go
│   ├── campaign/
│   │   ├── manager.go           # Campaign lifecycle
│   │   ├── worker_pool.go       # Goroutine dialer pool
│   │   └── csv_parser.go
│   ├── dialer/
│   │   ├── provider.go          # TelephonyProvider interface + factory
│   │   ├── twilio_client.go     # Active implementation
│   │   └── call_outcome.go
│   ├── queue/
│   │   └── redis_queue.go       # Redis-based contact queue
│   └── models/
│       ├── campaign.go
│       └── contact.go
├── config/
│   └── config.go
└── Dockerfile
```

### 4.2 Worker Pool Design

The core of the Power Dialer is a goroutine worker pool with a semaphore for concurrency control:

```go
// internal/campaign/worker_pool.go

type WorkerPool struct {
    semaphore chan struct{}         // controls max concurrency
    campaign  *models.Campaign
    queue     *queue.RedisQueue
    dialer    dialer.TelephonyProvider  // interface, not concrete type
    results   chan CallResult
    done      chan struct{}
}

func (wp *WorkerPool) Start(ctx context.Context) {
    for {
        select {
        case <-ctx.Done():
            return
        default:
            contact, err := wp.queue.Dequeue(ctx, wp.campaign.ID)
            if err != nil || contact == nil {
                return // queue empty or campaign stopped
            }

            wp.semaphore <- struct{}{} // acquire slot
            go func(c *models.Contact) {
                defer func() { <-wp.semaphore }() // release slot
                result := wp.dialer.Call(ctx, c, wp.campaign)
                wp.results <- result

                if wp.campaign.DelaySeconds > 0 {
                    time.Sleep(time.Duration(wp.campaign.DelaySeconds) * time.Second)
                }
            }(contact)
        }
    }
}
```

### 4.3 API Endpoints (Go Echo)

| Method | Path | Description |
|---|---|---|
| POST | `/campaigns` | Create and start a campaign |
| GET | `/campaigns/:id` | Get campaign status and progress |
| POST | `/campaigns/:id/pause` | Pause a running campaign |
| POST | `/campaigns/:id/resume` | Resume a paused campaign |
| POST | `/campaigns/:id/stop` | Stop and finalize a campaign |
| GET | `/campaigns/:id/results` | Get call results (paginated) |
| GET | `/campaigns/:id/export` | Download results as CSV |
| GET | `/health` | Health check |

### 4.4 Communication with NestJS

NestJS calls the Go service via internal HTTP. The Go service is not exposed to the internet.

```
NestJS DialerService → POST http://dialer-service:8080/campaigns → Go Echo
Go Echo → POST http://nestjs-api:3000/internal/dialer/callback → NestJS (progress updates)
```

---

## 5. Database Design

### 5.1 ORM

Prisma ORM is used in the NestJS service. Go uses `database/sql` with `pgx` driver directly.

### 5.2 Schema

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  totp_secret VARCHAR(255),
  plan_id UUID REFERENCES plans(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phone Numbers (DIDs)
-- provider_sid and provider replace the original twilio_sid column
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,          -- E.164 format
  provider_sid VARCHAR(50) NOT NULL,    -- provider-neutral (was: twilio_sid)
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio', -- 'twilio' | 'vonage' | 'bandwidth' | 'plivo' | 'telnyx'
  friendly_name VARCHAR(100),
  country_code CHAR(2) NOT NULL,
  capabilities JSONB NOT NULL,          -- {voice: true, sms: true, mms: false}
  status VARCHAR(20) DEFAULT 'active',  -- active, releasing, released
  monthly_cost DECIMAL(8,4),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations (message threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_number VARCHAR(20) NOT NULL,     -- user's DID
  to_number VARCHAR(20) NOT NULL,       -- external number
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, from_number, to_number)
);

-- Messages
-- provider_sid and provider replace the original twilio_sid column
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  provider_sid VARCHAR(50),             -- provider-neutral (was: twilio_sid)
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio',
  direction VARCHAR(10) NOT NULL,       -- inbound, outbound
  body TEXT,
  media_urls TEXT[],
  status VARCHAR(20) NOT NULL,          -- queued, sent, delivered, failed
  error_code VARCHAR(20),
  segments INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Calls (CDRs)
-- provider_call_sid and provider replace the original twilio_call_sid column
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_call_sid VARCHAR(50) UNIQUE, -- provider-neutral (was: twilio_call_sid)
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio',
  from_number VARCHAR(20) NOT NULL,
  to_number VARCHAR(20) NOT NULL,
  direction VARCHAR(10) NOT NULL,       -- inbound, outbound
  status VARCHAR(20) NOT NULL,          -- initiated, ringing, in-progress, completed, failed, busy, no-answer
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  recording_duration INTEGER,
  cost DECIMAL(10,6),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voicemails
CREATE TABLE voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  recording_url TEXT NOT NULL,
  transcript TEXT,
  duration_seconds INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,
  label VARCHAR(50)                     -- mobile, work, home
);

-- Power Dialer Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',   -- draft, running, paused, completed, stopped
  from_number VARCHAR(20) NOT NULL,
  concurrency INTEGER DEFAULT 1,
  delay_seconds INTEGER DEFAULT 0,
  retry_max INTEGER DEFAULT 0,
  voicemail_drop_url TEXT,
  calling_hours_start TIME,
  calling_hours_end TIME,
  calling_hours_timezone VARCHAR(50),
  total_contacts INTEGER DEFAULT 0,
  dialed INTEGER DEFAULT 0,
  answered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- pending, dialing, answered, no-answer, busy, failed, dnc
  attempts INTEGER DEFAULT 0,
  call_duration INTEGER,
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id, status);

-- Plans & Billing
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,            -- Free, Pro, Business
  stripe_price_id VARCHAR(100),
  max_numbers INTEGER NOT NULL,
  included_minutes INTEGER NOT NULL,
  included_sms INTEGER NOT NULL,
  power_dialer_enabled BOOLEAN DEFAULT false,
  monthly_price DECIMAL(8,2)
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID REFERENCES plans(id),
  stripe_subscription_id VARCHAR(100),
  status VARCHAR(20),                   -- active, canceled, past_due
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Records (per-user monthly tracking)
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  minutes_used INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  sms_received INTEGER DEFAULT 0,
  numbers_held INTEGER DEFAULT 0,
  prepaid_credits_remaining DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, period_start DESC);

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,          -- draft, open, paid, void, uncollectible
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pdf_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invoices_user ON invoices(user_id, created_at DESC);
```

### 5.3 Migration from v1.0 Schema

The following migration applies when upgrading from the original schema (which used `twilio_sid` / `twilio_call_sid`):

```sql
-- phone_numbers
ALTER TABLE phone_numbers RENAME COLUMN twilio_sid TO provider_sid;
ALTER TABLE phone_numbers ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';

-- messages
ALTER TABLE messages RENAME COLUMN twilio_sid TO provider_sid;
ALTER TABLE messages ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';

-- calls
ALTER TABLE calls RENAME COLUMN twilio_call_sid TO provider_call_sid;
ALTER TABLE calls ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';
ALTER TABLE calls RENAME CONSTRAINT calls_twilio_call_sid_key TO calls_provider_call_sid_key;

-- Indexes
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
```

### 5.4 Indexes Strategy

```sql
-- High-frequency lookups
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_calls_user_created ON calls(user_id, created_at DESC);
CREATE INDEX idx_phone_numbers_user ON phone_numbers(user_id) WHERE status = 'active';
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);  -- webhook lookup
CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
```

---

## 6. Real-Time Communication

### 6.1 WebSocket Architecture

```
Browser ──WSS──► NestJS WebSocket Gateway
                        │
                        ├── user:{userId} room (per-user events)
                        └── campaign:{id} room (campaign progress)
```

Events emitted to clients:

| Event | Payload | Trigger |
|---|---|---|
| `message:new` | Full message object | Inbound SMS received |
| `message:status` | `{id, status}` | SMS delivery status update |
| `call:inbound` | `{callSid, from, to}` | Inbound call arrives |
| `call:status` | `{callSid, status, duration}` | Call status change |
| `campaign:progress` | `{id, dialed, answered, failed, remaining}` | Every 5 dials |
| `campaign:complete` | `{id, summary}` | Campaign finishes |

All statuses in event payloads use VoiceLink's normalized internal status enums, not provider-native strings. See the PAL addendum §6 for the full mapping table.

### 6.2 WebRTC Call Flow

```
Browser                  NestJS                    Telephony Provider
   │                        │                               │
   │── POST /calls/token ──►│                               │
   │◄── {token, provider} ──│                               │
   │                        │                               │
   │── initializeCallClient(provider) ─────────────────────►│
   │                        │                               │
   │                        │◄── webhook: call init ────────│
   │                        │── call control response ─────►│
   │                        │                               │
   │◄──────────── WebRTC audio stream ────────────────────►│
   │                        │                               │
   │── disconnect() ────────────────────────────────────────►│
   │                        │◄── webhook: call end ─────────│
   │                        │── store CDR ──────────────────│
```

---

## 7. Telephony Integration

VoiceLink's telephony layer is abstracted behind the **Telephony Provider Abstraction Layer (PAL)**. See the PAL addendum document for the full interface contract, provider capability matrix, status normalization tables, and phasing plan. This section covers the runtime configuration and webhook routing.

### 7.1 Provider Configuration

The active provider is selected via the `TELEPHONY_PROVIDER` environment variable. No code changes are required to switch providers — only credentials and the env var. See §8.3 for the full environment variable reference.

Each provisioned number has webhooks registered with the active provider pointing to provider-namespaced URLs:

| Webhook | URL Pattern | Trigger |
|---|---|---|
| Voice Request | `POST /webhooks/:provider/voice` | Inbound call arrives |
| Voice Status | `POST /webhooks/:provider/voice/status` | Call status changes |
| SMS Inbound | `POST /webhooks/:provider/sms` | Inbound SMS arrives |
| SMS Status | `POST /webhooks/:provider/sms/status` | SMS delivery update |

The `:provider` path segment allows the webhook controller to select the correct signature validation and payload normalization implementation while routing into a single shared business logic layer.

### 7.2 Call Control Response

Inbound call handling returns a provider-appropriate call control document (TwiML for Twilio, NCCO for Vonage, BXML for Bandwidth, etc.) via `TelephonyProvider.generateCallControlResponse()`. Business logic never constructs raw TwiML/NCCO strings directly.

Example flow for inbound call (provider-neutral):

```typescript
@Post(':provider/voice')
@UseGuards(WebhookSignatureGuard)
async handleInboundCall(
  @Param('provider') providerName: string,
  @Req() req: RawWebhookRequest,
) {
  const provider = this.telephonyRegistry.get(providerName);
  const normalized = provider.parseInboundCallWebhook(req);
  const user = await this.numbersService.getUserByNumber(normalized.to);

  if (!user) {
    return provider.generateCallControlResponse({ type: 'reject' });
  }

  await this.callingGateway.emitInboundCall(user.id, {
    callSid: normalized.providerCallSid,
    from: normalized.from,
    to: normalized.to,
  });

  return provider.generateCallControlResponse({
    type: 'dial-client',
    clientId: user.id,
    timeout: 30,
    voicemailRedirect: `/webhooks/${providerName}/voice/voicemail?userId=${user.id}`,
  });
}
```

### 7.3 Voicemail Transcription Fallback

When the active provider supports voicemail transcription natively (e.g., Twilio), `TelephonyProvider.transcribeRecording()` is called directly. When the provider does not support it (Vonage, Bandwidth, Plivo, Telnyx), `CallingService` falls back to an external speech-to-text service (e.g., OpenAI Whisper API) after retrieving the recording. The `ProviderCapabilities.voicemailTranscription` flag controls which path is taken.

---

## 8. Infrastructure & Deployment

### 8.1 Docker Compose (Development)

```yaml
services:
  frontend:
    build: ./frontend
    ports: ['3000:3000']
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000
      - NEXT_PUBLIC_WS_URL=ws://localhost:4000

  api:
    build: ./backend
    ports: ['4000:4000']
    depends_on: [postgres, redis]
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/voicelink
      - REDIS_URL=redis://redis:6379
      - DIALER_SERVICE_URL=http://dialer:8080

  dialer:
    build: ./dialer-service
    ports: ['8080:8080']
    depends_on: [redis]
    environment:
      - REDIS_URL=redis://redis:6379
      - NESTJS_CALLBACK_URL=http://api:4000/internal/dialer

  postgres:
    image: postgres:15-alpine
    volumes: ['pgdata:/var/lib/postgresql/data']
    environment:
      - POSTGRES_DB=voicelink
      - POSTGRES_PASSWORD=postgres

  redis:
    image: redis:7-alpine
    volumes: ['redisdata:/data']

volumes:
  pgdata:
  redisdata:
```

### 8.2 Production Infrastructure

```
Cloudflare (DNS + CDN + WAF)
        │
        ├── voicelink.io          → Vercel (Next.js)
        └── api.voicelink.io      → Kubernetes cluster
                                        │
                                        ├── NestJS pods (3 replicas min)
                                        ├── Go Dialer pods (auto-scaled)
                                        ├── PostgreSQL (managed - Supabase or RDS)
                                        └── Redis (managed - Upstash or ElastiCache)
```

### 8.3 Environment Variables

**NestJS:**
```
DATABASE_URL=
REDIS_URL=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

# Active provider selection
TELEPHONY_PROVIDER=twilio   # twilio | vonage | bandwidth | plivo | telnyx

# Twilio credentials (active in v1)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY=
TWILIO_API_SECRET=

# Vonage credentials (stub in v1 — populate to activate)
VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_APPLICATION_ID=
VONAGE_PRIVATE_KEY=

# Bandwidth credentials (stub in v1)
BANDWIDTH_USERNAME=
BANDWIDTH_PASSWORD=
BANDWIDTH_ACCOUNT_ID=
BANDWIDTH_APPLICATION_ID=

# Plivo credentials (stub in v1)
PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=

# Telnyx credentials (stub in v1)
TELNYX_API_KEY=
TELNYX_PUBLIC_KEY=

# Other integrations
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
SENDGRID_API_KEY=
DIALER_SERVICE_URL=
INTERNAL_API_KEY=
API_BASE_URL=
```

**Go Dialer:**
```
PORT=8080
REDIS_URL=
TELEPHONY_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
NESTJS_CALLBACK_URL=
INTERNAL_API_KEY=
```

---

## 9. Caching Strategy

| Data | Cache | TTL | Invalidation |
|---|---|---|---|
| JWT refresh token | Redis | 30 days | On logout, password change |
| WebRTC access token (per user) | Redis | 55 minutes | Expiry |
| User plan limits | Redis | 1 hour | On plan change |
| Phone number → user lookup | Redis | 24 hours | On number release |
| Campaign progress counters | Redis | Campaign lifetime | On campaign end |
| Rate limit counters | Redis | 15 minutes | Expiry |

---

## 10. API Design Standards

### 10.1 Response Envelope

```json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 342
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PHONE_NUMBER",
    "message": "The phone number +1234 is not a valid E.164 number.",
    "field": "to"
  }
}
```

### 10.2 Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, receive tokens |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/numbers` | List user's numbers |
| POST | `/api/v1/numbers/search` | Search available DIDs |
| POST | `/api/v1/numbers` | Provision a number |
| DELETE | `/api/v1/numbers/:id` | Release a number |
| GET | `/api/v1/conversations` | List conversations |
| GET | `/api/v1/conversations/:id/messages` | Get messages |
| POST | `/api/v1/messages` | Send SMS |
| GET | `/api/v1/calls` | Call history |
| POST | `/api/v1/calls/token` | Get WebRTC access token + provider |
| POST | `/api/v1/calls` | Initiate outbound call |
| GET | `/api/v1/campaigns` | List campaigns |
| POST | `/api/v1/campaigns` | Create campaign |
| POST | `/api/v1/campaigns/:id/start` | Start campaign |
| POST | `/api/v1/campaigns/:id/pause` | Pause campaign |
| GET | `/api/v1/campaigns/:id/export` | Export results |

---

*Document Owner: Tech Lead | Updated: Before each sprint planning*