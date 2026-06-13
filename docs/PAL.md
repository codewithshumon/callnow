# Technical Design Addendum
## VoiceLink — Telephony Provider Abstraction Layer (PAL)

| Field | Detail |
|---|---|
| Document Version | 1.0 |
| Status | Draft |
| Applies To | SDD §3, §4, §5, §7 · SRS §4.3, §8 · API Reference (all telephony endpoints) |
| Supported Providers (v1) | Twilio (default/active), Vonage, Bandwidth, Plivo, Telnyx (stubs) |

---

## 1. Purpose

VoiceLink must not be hard-wired to Twilio. All voice, SMS/MMS, and number-provisioning operations shall go through a **Telephony Provider Abstraction Layer (PAL)** so the active provider can be changed via configuration, without code changes to controllers, services, the database schema, or the frontend.

This document defines the interface contract, configuration mechanism, data model changes, and webhook normalization required to support multiple providers. Twilio is the only **active** implementation at launch; other providers are defined as the same interface with stub/placeholder implementations to be completed later.

---

## 2. Design Principles

- **Single interface, swappable implementation.** NestJS services and the Go dialer call a `TelephonyProvider` interface — never an SDK directly.
- **Config-driven selection.** The active provider is selected via environment variable (`TELEPHONY_PROVIDER`), read at boot. No redeploy of business logic is required to switch providers — only credentials and the env var.
- **Provider-neutral data model.** Database columns, API response fields, and WebSocket event payloads use generic names (`provider_sid`, `provider`, `provider_call_sid`) instead of `twilio_sid`.
- **Normalized webhooks.** Each provider's webhook payload is translated into a common internal event shape before it reaches business logic.
- **Capability flags, not assumptions.** Not all providers support every feature (e.g., voicemail transcription, MMS in all regions). The PAL exposes a capability map so the app can degrade gracefully.
- **Per-number provider assignment (future-proofing).** While v1 assumes one global provider, the schema supports a `provider` column on `phone_numbers` so numbers from different providers can coexist later (e.g., during a migration).

---

## 3. Provider Interface Contract

All providers implement this interface (NestJS, TypeScript). The Go dialer service implements an equivalent Go interface for outbound calling.

```typescript
// backend/src/telephony/interfaces/telephony-provider.interface.ts

export interface TelephonyProvider {
  readonly name: string; // 'twilio' | 'vonage' | 'bandwidth' | 'plivo' | 'telnyx'
  readonly capabilities: ProviderCapabilities;

  // --- Numbers ---
  searchAvailableNumbers(params: NumberSearchParams): Promise<AvailableNumber[]>;
  provisionNumber(number: string, webhookConfig: WebhookConfig): Promise<ProvisionedNumber>;
  releaseNumber(providerSid: string): Promise<void>;
  configureNumberWebhooks(providerSid: string, webhookConfig: WebhookConfig): Promise<void>;

  // --- Messaging ---
  sendMessage(params: SendMessageParams): Promise<ProviderMessageResult>;

  // --- Calling ---
  generateClientToken(identity: string): Promise<{ token: string; expiresIn: number }>;
  initiateOutboundCall(params: OutboundCallParams): Promise<ProviderCallResult>;
  generateCallControlResponse(action: CallControlAction): string; // returns TwiML/NCCO/BXML equivalent

  // --- Webhooks (inbound, normalized) ---
  validateWebhookSignature(req: RawWebhookRequest): boolean;
  parseInboundMessageWebhook(req: RawWebhookRequest): NormalizedInboundMessage;
  parseInboundCallWebhook(req: RawWebhookRequest): NormalizedInboundCall;
  parseStatusCallback(req: RawWebhookRequest): NormalizedStatusEvent;

  // --- Voicemail ---
  getRecording(providerRecordingSid: string): Promise<{ url: string; durationSeconds: number }>;
  transcribeRecording?(providerRecordingSid: string): Promise<string>; // optional capability
}

export interface ProviderCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  voicemailTranscription: boolean;
  callRecording: boolean;
  conferenceCalling: boolean;
  numberPorting: boolean;
  tollFreeNumbers: boolean;
  supportedCountries: string[]; // ISO country codes
}
```

### 3.1 Normalized Event Shapes

Regardless of provider, webhooks are translated into these shapes before reaching `MessagingService` / `CallingService`:

```typescript
export interface NormalizedInboundMessage {
  providerMessageSid: string;
  from: string;        // E.164
  to: string;          // E.164
  body: string;
  mediaUrls: string[];
  receivedAt: string;  // ISO 8601
}

export interface NormalizedInboundCall {
  providerCallSid: string;
  from: string;
  to: string;
  direction: 'inbound';
}

export interface NormalizedStatusEvent {
  providerSid: string;       // message or call sid
  resourceType: 'message' | 'call';
  status: string;            // normalized status enum (see §6)
  errorCode?: string;
  timestamp: string;
}
```

---

## 4. Configuration

### 4.1 Environment Variables

```
# Active provider selection
TELEPHONY_PROVIDER=twilio        # twilio | vonage | bandwidth | plivo | telnyx

# Per-provider credential blocks (only the active provider's block is required at runtime,
# but all may be present to allow hot-switching in non-prod environments)

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY=
TWILIO_API_SECRET=

VONAGE_API_KEY=
VONAGE_API_SECRET=
VONAGE_APPLICATION_ID=
VONAGE_PRIVATE_KEY=

BANDWIDTH_USERNAME=
BANDWIDTH_PASSWORD=
BANDWIDTH_ACCOUNT_ID=
BANDWIDTH_APPLICATION_ID=

PLIVO_AUTH_ID=
PLIVO_AUTH_TOKEN=

TELNYX_API_KEY=
TELNYX_PUBLIC_KEY=

# Shared
API_BASE_URL=
```

### 4.2 NestJS Provider Factory

```typescript
// backend/src/telephony/telephony.module.ts

@Module({
  providers: [
    {
      provide: 'TELEPHONY_PROVIDER',
      useFactory: (config: ConfigService): TelephonyProvider => {
        switch (config.get('TELEPHONY_PROVIDER')) {
          case 'twilio':    return new TwilioProvider(config);
          case 'vonage':    return new VonageProvider(config);
          case 'bandwidth': return new BandwidthProvider(config);
          case 'plivo':     return new PlivoProvider(config);
          case 'telnyx':    return new TelnyxProvider(config);
          default: throw new Error('Unsupported TELEPHONY_PROVIDER');
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['TELEPHONY_PROVIDER'],
})
export class TelephonyModule {}
```

All consuming services (`MessagingService`, `CallingService`, `NumbersService`, `DialerService`) inject `TELEPHONY_PROVIDER` via `@Inject('TELEPHONY_PROVIDER')` rather than importing a Twilio client directly.

### 4.3 Go Dialer Service

The Go service mirrors this with an interface + factory in `internal/dialer/provider.go`, selected via the same `TELEPHONY_PROVIDER` env var. v1 ships `TwilioClient` implementing the interface; other providers are stubs returning `ErrNotImplemented`.

---

## 5. Webhook Routing (Provider-Agnostic Endpoints)

Webhook URLs registered with the provider must remain stable even if the provider changes (since switching providers shouldn't require re-provisioning every number's webhook config where avoidable, and so monitoring/logging stays consistent).

```
POST /webhooks/:provider/voice
POST /webhooks/:provider/voice/status
POST /webhooks/:provider/sms
POST /webhooks/:provider/sms/status
```

The `:provider` path segment lets the controller select the correct `validateWebhookSignature` and `parseInbound*` implementation while routing into the same `MessagingService` / `CallingService` logic. This also allows **multiple providers to be active simultaneously** during a migration window (e.g., legacy numbers on Twilio, new numbers on Bandwidth).

```typescript
@Post(':provider/voice')
async handleInboundCall(
  @Param('provider') providerName: string,
  @Req() req: RawWebhookRequest,
) {
  const provider = this.telephonyRegistry.get(providerName);
  if (!provider.validateWebhookSignature(req)) {
    throw new ForbiddenException('Invalid signature');
  }
  const normalized = provider.parseInboundCallWebhook(req);
  // ... existing business logic, unchanged ...
  return provider.generateCallControlResponse({ type: 'dial-client', clientId: user.id });
}
```

---

## 6. Status Code Normalization

Providers use different strings for the same concepts. The PAL maps provider-native statuses to VoiceLink's internal enums.

### 6.1 Message Status

| VoiceLink Status | Twilio | Vonage | Bandwidth |
|---|---|---|---|
| `queued` | `queued` | `submitted` | `QUEUED` |
| `sent` | `sent` | `sent` | `SENDING` |
| `delivered` | `delivered` | `delivered` | `DELIVERED` |
| `failed` | `failed`, `undelivered` | `failed`, `rejected` | `FAILED` |

### 6.2 Call Status

| VoiceLink Status | Twilio | Vonage | Bandwidth |
|---|---|---|---|
| `initiated` | `queued`, `initiated` | `started` | `initiated` |
| `ringing` | `ringing` | `ringing` | `alerting` |
| `in-progress` | `in-progress` | `answered` | `answered` |
| `completed` | `completed` | `completed` | `disconnected` (normal) |
| `failed` | `failed` | `failed` | `disconnected` (error) |
| `busy` | `busy` | `busy` | `disconnected` (busy) |
| `no-answer` | `no-answer` | `cancelled`, `timeout` | `disconnected` (timeout) |

This mapping table lives in `backend/src/telephony/status-maps/` as one JSON file per provider, so it can be extended without code changes.

---

## 7. Database Schema Changes

These changes apply to the schema defined in SDD §5.2.

```sql
-- phone_numbers: add provider tracking, rename twilio_sid → provider_sid
ALTER TABLE phone_numbers RENAME COLUMN twilio_sid TO provider_sid;
ALTER TABLE phone_numbers ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';
-- provider values: 'twilio', 'vonage', 'bandwidth', 'plivo', 'telnyx'

-- messages: rename twilio_sid → provider_sid, add provider
ALTER TABLE messages RENAME COLUMN twilio_sid TO provider_sid;
ALTER TABLE messages ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';

-- calls: rename twilio_call_sid → provider_call_sid, add provider
ALTER TABLE calls RENAME COLUMN twilio_call_sid TO provider_call_sid;
ALTER TABLE calls ADD COLUMN provider VARCHAR(20) NOT NULL DEFAULT 'twilio';
ALTER TABLE calls RENAME CONSTRAINT calls_twilio_call_sid_key TO calls_provider_call_sid_key;

-- Indexes
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);
```

`provider` defaults to `'twilio'` for v1, but every row carries it so historical records remain correctly attributed even after a future provider switch.

---

## 8. API Response Changes

The API Reference (v1) field `twilioSid` is renamed `providerSid` throughout, with a new `provider` field added alongside it.

**Before:**
```json
{ "id": "uuid", "twilioSid": "SM...", "status": "queued", "createdAt": "..." }
```

**After:**
```json
{ "id": "uuid", "provider": "twilio", "providerSid": "SM...", "status": "queued", "createdAt": "..." }
```

This applies to: `POST /messages` response, `GET /conversations/:id/messages`, `GET /calls`, and `GET /numbers`.

---

## 9. Frontend Impact

Minimal. The frontend never calls provider SDKs directly except for WebRTC:

- `lib/webrtc.ts` currently imports `@twilio/voice-sdk` directly. This must be wrapped in a `WebRTCClient` interface so a Vonage Client SDK or Bandwidth WebRTC SDK can be substituted. The factory reads the active provider from `GET /calls/token`, which now also returns a `provider` field so the frontend loads the correct SDK.

```typescript
// lib/webrtc.ts
export async function initializeCallClient(tokenResponse: { token: string; provider: string }) {
  switch (tokenResponse.provider) {
    case 'twilio': return initTwilioDevice(tokenResponse.token);
    case 'vonage': return initVonageClient(tokenResponse.token);
    // ...
  }
}
```

- `GET /calls/token` response gains a `provider` field:
```json
{ "success": true, "data": { "token": "eyJ...", "expiresIn": 3600, "provider": "twilio" } }
```

---

## 10. Provider Capability Matrix (Reference)

| Capability | Twilio | Vonage | Bandwidth | Plivo | Telnyx |
|---|---|---|---|---|---|
| Voice (PSTN) | ✅ | ✅ | ✅ | ✅ | ✅ |
| SMS | ✅ | ✅ | ✅ | ✅ | ✅ |
| MMS | ✅ | Limited (US only) | ✅ | ✅ | ✅ |
| Voicemail transcription | ✅ (built-in) | ❌ (requires external STT) | ❌ (requires external STT) | ❌ | ❌ |
| Call recording | ✅ | ✅ | ✅ | ✅ | ✅ |
| Conference calling | ✅ | ✅ | ✅ | ✅ | ✅ |
| Number porting | ✅ | ✅ | ✅ | ✅ | ✅ |
| Toll-free numbers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Browser WebRTC SDK | ✅ (Voice SDK) | ✅ (Client SDK) | ✅ (WebRTC SDK) | ⚠️ (limited) | ⚠️ (limited) |

**Implication for FR-CALL-08** (voicemail transcription): if the provider is switched away from Twilio, VoiceLink must fall back to an external speech-to-text service (e.g., Whisper API) invoked by the backend after recording retrieval. The PAL's optional `transcribeRecording?` method signals this — when absent, `CallingService` calls the fallback STT service instead.

---

## 11. Implementation Phasing

| Phase | Scope |
|---|---|
| **Phase 1 (v1 launch)** | Implement `TwilioProvider` fully. Define interface, config factory, normalized schema/columns, status maps. All other providers are stub classes implementing the interface and throwing `NotImplementedException`. |
| **Phase 2** | Implement `VonageProvider` as second provider to validate abstraction (dual-provider testing in staging). |
| **Phase 3** | Implement `BandwidthProvider`, `PlivoProvider`, `TelnyxProvider` on demand based on cost/coverage needs. |
| **Phase 4** | Multi-provider routing — assign provider per number (e.g., route EU numbers to a different provider for cost), using the `provider` column already present from Phase 1. |

---

## 12. Required Edits to Existing Documents

| Document | Section | Change |
|---|---|---|
| SDD | §3.3, §8.3 | Replace `TwilioWebhookGuard` / Twilio-only env vars with PAL-based guard + per-provider env blocks (§4.1 above) |
| SDD | §2.3 | `lib/webrtc.ts` becomes provider-agnostic `WebRTCClient` wrapper (§9 above) |
| SDD | §5.2 | Apply schema migration in §7 above (`provider_sid`, `provider` columns) |
| SDD | §7 | Replace Twilio-specific TwiML generation with `generateCallControlResponse()` |
| SRS | §4.3, §8.1 | Replace "Twilio (primary), Vonage (fallback)" with reference to this PAL document; remove implication that Vonage is merely a fallback — it's a fully interchangeable provider |
| SRS | FR-CALL-08 | Add note: transcription requires external STT fallback for non-Twilio providers (§10) |
| API Reference | All `twilioSid` fields | Rename to `providerSid`, add `provider` field (§8 above) |
| API Reference | `POST /calls/token` | Add `provider` field to response |

---

*Document Owner: Tech Lead | This document supersedes any Twilio-specific assumptions in SDD/SRS until merged into the next major revision of those documents.*