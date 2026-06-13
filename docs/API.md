# API Reference
## VoiceLink REST API v1

**Base URL:** `https://api.voicelink.io/api/v1`
**WebSocket:** `wss://api.voicelink.io/ws`
**Auth:** Bearer JWT in `Authorization` header

All requests and responses use `Content-Type: application/json` unless noted.

---

## Authentication

### POST /auth/register
Register a new user account.

**Request:**
```json
{
  "email": "sarah@example.com",
  "password": "SecurePass123!"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "sarah@example.com" },
    "message": "Verification email sent"
  }
}
```

---

### POST /auth/login
```json
// Request
{ "email": "sarah@example.com", "password": "SecurePass123!" }

// Response 200
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 900
  }
}
```

---

### POST /auth/refresh
```json
// Request
{ "refreshToken": "eyJ..." }

// Response 200
{ "success": true, "data": { "accessToken": "eyJ...", "expiresIn": 900 } }
```

---

### POST /auth/logout
Invalidate the current refresh token and end the session.

**Request:**
```json
{ "refreshToken": "eyJ..." }
```
**Response 200:**
```json
{ "success": true, "data": { "message": "Logged out" } }
```

---

### POST /auth/verify-email
Verify email address using the token sent during registration.

**Request:**
```json
{ "token": "abc123..." }
```
**Response 200:**
```json
{ "success": true, "data": { "message": "Email verified" } }
```

---

### POST /auth/forgot-password
Request a password reset email.

**Request:**
```json
{ "email": "sarah@example.com" }
```
**Response 200:**
```json
{ "success": true, "data": { "message": "If the email exists, a reset link has been sent" } }
```

---

### POST /auth/reset-password
Reset password using the token received in email.

**Request:**
```json
{ "token": "abc123...", "password": "NewSecurePass123!" }
```
**Response 200:**
```json
{ "success": true, "data": { "message": "Password reset successful" } }
```

---

### POST /auth/google
Authenticate with a Google OAuth 2.0 ID token.

**Request:**
```json
{ "idToken": "eyJ..." }
```
**Response 200:**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 } }
```

---

### POST /auth/login/phone
Request or verify an SMS OTP for phone-based login.

**Request (request OTP):**
```json
{ "phone": "+14155551234", "action": "request" }
```
**Request (verify OTP):**
```json
{ "phone": "+14155551234", "code": "123456", "action": "verify" }
```
**Response 200 (verify success):**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 } }
```

---

### POST /auth/2fa/enable
Enable TOTP two-factor authentication for the authenticated user. Returns a TOTP secret and QR code URL for setup.

**Response 200:**
```json
{ "success": true, "data": { "secret": "JBSWY3DPEHPK3PXP", "qrCodeUrl": "otpauth://..." } }
```

---

### POST /auth/2fa/verify
Verify a TOTP code during login (when 2FA is enabled on the account).

**Request:**
```json
{ "loginToken": "eyJ...", "code": "123456" }
```
**Response 200:**
```json
{ "success": true, "data": { "accessToken": "eyJ...", "refreshToken": "eyJ...", "expiresIn": 900 } }
```

---

## Phone Numbers

### GET /numbers
List all numbers belonging to the authenticated user.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "twilio",
      "providerSid": "PN...",
      "number": "+14155551234",
      "friendlyName": "My US Number",
      "countryCode": "US",
      "capabilities": { "voice": true, "sms": true, "mms": true },
      "status": "active",
      "monthlyCost": 1.15,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

---

### GET /numbers/search
Search available numbers to purchase.

**Query params:** `?countryCode=US&areaCode=415&capabilities=voice,sms`

**Response 200:**
**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "number": "+14155559876",
      "locality": "San Francisco",
      "region": "CA",
      "capabilities": { "voice": true, "sms": true, "mms": false },
      "monthlyCost": 1.00
    }
  ]
}
```

---

### POST /numbers
Provision (purchase) a number.

**Request:** `{ "number": "+14155559876" }`

**Response 201:** Returns the created phone number object (including `provider` and `providerSid` fields).

---

### DELETE /numbers/:id
Release a phone number. Enters 7-day grace period.

**Response 200:** `{ "success": true, "data": { "releasedAt": "2024-01-15T..." } }`

---

## Messaging

### GET /conversations
List all conversations, sorted by last message.

**Query params:** `?page=1&limit=20`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fromNumber": "+14155551234",
      "toNumber": "+447911123456",
      "contactName": "John Smith",
      "lastMessage": { "body": "Thanks!", "direction": "inbound", "createdAt": "..." },
      "unreadCount": 2
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 47 }
}
```

---

### GET /conversations/:id/messages
**Query params:** `?page=1&limit=50`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "twilio",
      "providerSid": "SM...",
      "direction": "outbound",
      "body": "Hello from VoiceLink!",
      "mediaUrls": [],
      "status": "delivered",
      "createdAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

---

### POST /messages
Send an SMS or MMS.

**Request:**
```json
{
  "fromNumber": "+14155551234",
  "toNumber": "+447911123456",
  "body": "Hello from VoiceLink!",
  "mediaUrls": [],
  "scheduledAt": null
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "twilio",
    "providerSid": "SM...",
    "status": "queued",
    "createdAt": "2024-01-15T10:05:00Z"
  }
}
```

---

## Calling

### POST /calls/token
Get a short-lived access token for WebRTC. The `provider` field indicates which WebRTC SDK the frontend should load.

**Response 200:**
```json
{
  "success": true,
  "data": { "token": "eyJ...", "expiresIn": 3600, "provider": "twilio" }
}
```

---

### GET /calls
Call history for the authenticated user.

**Query params:** `?page=1&limit=20&direction=outbound`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "provider": "twilio",
      "providerSid": "CA...",
      "fromNumber": "+14155551234",
      "toNumber": "+447911123456",
      "direction": "outbound",
      "status": "completed",
      "durationSeconds": 187,
      "cost": "0.0234",
      "recordingUrl": null,
      "startedAt": "2024-01-15T10:00:00Z",
      "endedAt": "2024-01-15T10:03:07Z"
    }
  ]
}
```

---

### GET /voicemails
List voicemails for the authenticated user.

**Response 200:** Array of voicemail objects with `recordingUrl`, `transcript`, `isRead`, `durationSeconds`.

> **Note:** The `transcript` field is populated by the active telephony provider's transcription capability where available, or by an external speech-to-text service (e.g., Whisper API) for providers that do not support transcription natively.

---

### PATCH /voicemails/:id
Mark a voicemail as read. **Request:** `{ "isRead": true }`

---

## Power Dialer

### GET /campaigns
List all campaigns.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "January Leads",
      "status": "running",
      "totalContacts": 842,
      "dialed": 234,
      "answered": 89,
      "failed": 12,
      "remaining": 608,
      "startedAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

---

### POST /campaigns
Create a new campaign. Accepts `multipart/form-data` for CSV upload.

**Form fields:**
- `name` — campaign name
- `fromNumber` — E.164 number (must be owned by user)
- `concurrency` — integer 1–10
- `delaySeconds` — integer 0–60
- `retryMax` — integer 0–3
- `callingHoursStart` — `HH:MM` (24h)
- `callingHoursEnd` — `HH:MM` (24h)
- `callingHoursTimezone` — IANA timezone string
- `scheduledAt` — ISO 8601 (optional, null = start immediately)
- `contacts` — CSV file

**Response 201:** Returns campaign object including validation report.

---

### POST /campaigns/:id/start
Start or restart a paused campaign.

**Response 200:** `{ "success": true, "data": { "status": "running" } }`

---

### POST /campaigns/:id/pause
**Response 200:** `{ "success": true, "data": { "status": "paused" } }`

---

### POST /campaigns/:id/stop
Permanently stops a campaign. Cannot be restarted.

**Response 200:** `{ "success": true, "data": { "status": "stopped" } }`

---

### GET /campaigns/:id/export
Download campaign results as CSV.

**Response:** `Content-Type: text/csv` file download.

CSV columns: `phone, name, notes, status, attempts, call_duration, last_attempted_at`

---

## Contacts

### GET /contacts
**Query params:** `?search=john&tag=vip&page=1&limit=50`

### POST /contacts
```json
{
  "name": "John Smith",
  "phones": [{ "number": "+447911123456", "label": "mobile" }],
  "notes": "Met at conference",
  "tags": ["vip", "london"]
}
```

### PUT /contacts/:id
Full update of a contact.

### DELETE /contacts/:id

### POST /contacts/import
CSV import. Accepts `multipart/form-data` with `contacts` CSV file.
Columns: `name, phone, email, notes, tags`

---

## Billing

### GET /billing/usage
Current month usage for the authenticated user.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "plan": "Pro",
    "period": { "start": "2024-01-01", "end": "2024-01-31" },
    "usage": {
      "minutesUsed": 234,
      "minutesIncluded": 1000,
      "smsUsed": 89,
      "smsIncluded": 2000,
      "numbersHeld": 2,
      "numbersAllowed": 5
    }
  }
}
```

---

### GET /billing/invoices
List past invoices. Returns array with `id`, `amount`, `period`, `status`, `pdfUrl`.

---

## WebSocket Events

Connect: `wss://api.voicelink.io/ws` with `Authorization: Bearer {token}` header.

### Inbound Events (server → client)

**`message:new`** — New inbound SMS:
```json
{
  "event": "message:new",
  "data": {
    "conversationId": "uuid",
    "message": { "id": "uuid", "body": "Hello!", "from": "+447...", "createdAt": "..." }
  }
}
```

**`message:status`** — SMS delivery update:
```json
{ "event": "message:status", "data": { "messageId": "uuid", "status": "delivered" } }
```

**`call:inbound`** — Incoming call:
```json
{
  "event": "call:inbound",
  "data": { "callSid": "CA...", "from": "+14155559999", "to": "+14155551234" }
}
```

**`campaign:progress`** — Dialer progress update:
```json
{
  "event": "campaign:progress",
  "data": { "campaignId": "uuid", "dialed": 50, "answered": 20, "failed": 3, "remaining": 792 }
}
```

---

## Error Codes

| Code | HTTP | Description |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body fails validation |
| `INVALID_PHONE_NUMBER` | 422 | Phone number not valid E.164 |
| `NUMBER_NOT_OWNED` | 403 | Caller does not own the from-number |
| `PLAN_LIMIT_EXCEEDED` | 429 | Usage over plan limit |
| `RATE_LIMITED` | 429 | Too many requests |
| `PROVIDER_ERROR` | 502 | Upstream telephony provider error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

> **Note:** The legacy error code `TWILIO_ERROR` has been renamed `PROVIDER_ERROR` to reflect the provider-agnostic architecture.

---

*Auto-generated OpenAPI spec available at: `GET /api/v1/docs`*