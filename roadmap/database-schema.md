# VoiceLink — Complete Database Schema

> **Derived from:** SDD §5, SRS §6, PAL §7, API Reference
> **Database:** PostgreSQL 15+
> **ORM:** Prisma (NestJS) · `database/sql` + `pgx` (Go Dialer)
> **Date:** 2026-06-13

---

## Entity Relationship Diagram

```
users ───────────1:N─────────► phone_numbers
  │                              │
  ├────────────1:N─────────► conversations
  │                              │
  ├────────────1:N─────────► messages
  │
  ├────────────1:N─────────► calls
  │                              │
  │                              └───1:N───► voicemails
  │
  ├────────────1:N─────────► contacts
  │                              │
  │                              └───1:N───► contact_phones
  │
  ├────────────1:N─────────► campaigns
  │                              │
  │                              └───1:N───► campaign_contacts
  │
  ├────────────1:1─────────► subscriptions ───N:1───► plans
  │
  ├────────────1:N─────────► usage_records
  ├────────────1:N─────────► invoices
  ├────────────1:N─────────► refresh_tokens
  ├────────────1:N─────────► api_keys
  ├────────────1:N─────────► audit_logs
  ├────────────1:N─────────► message_templates
  └────────────1:N─────────► dnc_list

email_verification_tokens ──► user (lookup by email)
password_reset_tokens     ──► user (lookup by email)
otp_codes                 ──► user (lookup by phone)
```

---

## Complete Table Definitions

### 1. `users`
Core user accounts. Referenced by nearly every other table.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  totp_secret VARCHAR(255),
  totp_enabled BOOLEAN DEFAULT false,
  google_id VARCHAR(255) UNIQUE,            -- Google OAuth subject ID
  phone VARCHAR(20) UNIQUE,                 -- E.164, for phone OTP login
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user' | 'business' | 'admin'
  plan_id UUID REFERENCES plans(id),
  stripe_customer_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-AUTH-01 through FR-AUTH-10
**URD refs:** US-001 through US-006

---

### 2. `phone_numbers`
Virtual DID numbers provisioned through the PAL. Each belongs to one user.

```sql
CREATE TABLE phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,              -- E.164 format
  provider_sid VARCHAR(50) NOT NULL,        -- provider's native identifier
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio',  -- twilio|vonage|bandwidth|plivo|telnyx
  friendly_name VARCHAR(100),
  country_code CHAR(2) NOT NULL,
  capabilities JSONB NOT NULL,              -- {voice: bool, sms: bool, mms: bool}
  status VARCHAR(20) DEFAULT 'active',      -- active | releasing | released
  monthly_cost DECIMAL(8,4),
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-NUM-01 through FR-NUM-10
**URD refs:** US-010 through US-016
**PAL refs:** §5 webhook routing, §7 schema migration

---

### 3. `conversations`
Message threads between a user's DID and an external number.

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_number VARCHAR(20) NOT NULL,          -- user's DID (E.164)
  to_number VARCHAR(20) NOT NULL,            -- external number (E.164)
  contact_name VARCHAR(255),                 -- denormalized from contacts
  unread_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, from_number, to_number)
);
```

**SRS refs:** FR-MSG-02, FR-MSG-06
**API refs:** GET /conversations

---

### 4. `messages`
Individual SMS/MMS messages within a conversation.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  provider_sid VARCHAR(50),                 -- provider's native message SID
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio',
  direction VARCHAR(10) NOT NULL,           -- inbound | outbound
  body TEXT,
  media_urls TEXT[],
  status VARCHAR(20) NOT NULL,              -- queued | sent | delivered | failed
  error_code VARCHAR(20),
  segments INTEGER DEFAULT 1,
  scheduled_at TIMESTAMPTZ,                 -- NULL = send immediately
  read_at TIMESTAMPTZ,                      -- read receipt timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
```

**SRS refs:** FR-MSG-01 through FR-MSG-12
**URD refs:** US-020 through US-026
**API refs:** POST /messages, GET /conversations/:id/messages
**PAL refs:** §7 schema migration (provider_sid, provider columns)

---

### 5. `calls`
Call Detail Records (CDRs) — one row per call attempt.

```sql
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  provider_call_sid VARCHAR(50) UNIQUE,     -- provider's native call SID
  provider VARCHAR(20) NOT NULL DEFAULT 'twilio',
  from_number VARCHAR(20) NOT NULL,          -- E.164
  to_number VARCHAR(20) NOT NULL,            -- E.164
  direction VARCHAR(10) NOT NULL,            -- inbound | outbound
  status VARCHAR(20) NOT NULL,              -- initiated|ringing|in-progress|completed|failed|busy|no-answer
  duration_seconds INTEGER DEFAULT 0,
  recording_url TEXT,
  recording_duration INTEGER,
  recording_disclosure_played BOOLEAN DEFAULT false,  -- GDPR consent flag
  cost DECIMAL(10,6),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-CALL-01 through FR-CALL-14
**URD refs:** US-030 through US-038
**PAL refs:** §6.2 Call Status normalization, §7 schema migration

---

### 6. `voicemails`
Recordings and transcripts for missed calls.

```sql
CREATE TABLE voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID REFERENCES calls(id),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_number VARCHAR(20) NOT NULL,          -- E.164 — caller who left voicemail
  recording_url TEXT NOT NULL,
  transcript TEXT,                           -- populated by provider or external STT
  transcription_source VARCHAR(20),          -- 'provider' | 'external-stt'
  duration_seconds INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-CALL-07, FR-CALL-08
**URD refs:** US-033, US-034
**PAL refs:** §3 (transcribeRecording method), §10 (capability matrix)

---

### 7. `contacts`
User address book entries.

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-CON-01 through FR-CON-06
**URD refs:** US-050 through US-052

---

### 8. `contact_phones`
Phone numbers for a contact (one contact can have multiple phones).

```sql
CREATE TABLE contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  number VARCHAR(20) NOT NULL,              -- E.164
  label VARCHAR(50)                          -- mobile | work | home | other
);
```

**SRS refs:** FR-CON-02 (contacts store multiple phone numbers)

---

### 9. `campaigns`
Power dialer campaign definitions. The Go Echo service executes these.

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft',        -- draft | running | paused | completed | stopped
  from_number VARCHAR(20) NOT NULL,           -- E.164, must be owned by user
  concurrency INTEGER DEFAULT 1,              -- 1–10 simultaneous calls
  delay_seconds INTEGER DEFAULT 0,            -- 0–60 seconds between calls
  retry_max INTEGER DEFAULT 0,               -- 0–3
  voicemail_drop_url TEXT,                   -- pre-recorded voicemail message URL
  calling_hours_start TIME,                  -- e.g., 09:00
  calling_hours_end TIME,                    -- e.g., 17:00
  calling_hours_timezone VARCHAR(50),        -- IANA timezone
  total_contacts INTEGER DEFAULT 0,
  dialed INTEGER DEFAULT 0,
  answered INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  busy INTEGER DEFAULT 0,
  no_answer INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,                  -- NULL = start immediately
  started_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-PD-01 through FR-PD-15
**URD refs:** US-040 through US-049

---

### 10. `campaign_contacts`
Individual contacts within a dialer campaign. Populated from CSV upload.

```sql
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,                -- E.164
  name VARCHAR(255),                         -- from CSV
  notes TEXT,                                -- from CSV
  status VARCHAR(20) DEFAULT 'pending',      -- pending|dialing|answered|no-answer|busy|failed|dnc
  attempts INTEGER DEFAULT 0,
  call_duration INTEGER,                     -- seconds
  last_attempted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_campaign_contacts_campaign ON campaign_contacts(campaign_id, status);
CREATE INDEX idx_campaign_contacts_phone ON campaign_contacts(phone);
```

**SRS refs:** FR-PD-01, FR-PD-02, FR-PD-03, FR-PD-08
**URD refs:** US-040, US-041

---

### 11. `plans`
Subscription plan definitions.

```sql
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,                 -- Free | Pro | Business
  stripe_price_id VARCHAR(100),
  max_numbers INTEGER NOT NULL DEFAULT 1,
  included_minutes INTEGER NOT NULL DEFAULT 0,
  included_sms INTEGER NOT NULL DEFAULT 0,
  included_mms INTEGER NOT NULL DEFAULT 0,
  power_dialer_enabled BOOLEAN DEFAULT false,
  call_recording_enabled BOOLEAN DEFAULT false,
  voicemail_transcription_enabled BOOLEAN DEFAULT false,
  max_concurrency INTEGER DEFAULT 1,         -- for power dialer
  monthly_price DECIMAL(8,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-BILL-02
**URD refs:** US-061

---

### 12. `subscriptions`
Links user to plan. Tracks Stripe subscription state.

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES plans(id),
  stripe_subscription_id VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active | canceled | past_due | trialing
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**SRS refs:** FR-BILL-02, FR-BILL-03
**URD refs:** US-061

---

### 13. `usage_records`
Per-user monthly usage tracking. One row per user per billing period.

```sql
CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  minutes_used INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  sms_received INTEGER DEFAULT 0,
  mms_sent INTEGER DEFAULT 0,
  mms_received INTEGER DEFAULT 0,
  numbers_held INTEGER DEFAULT 0,
  prepaid_credits_remaining DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);
CREATE INDEX idx_usage_records_user_period ON usage_records(user_id, period_start DESC);
```

**SRS refs:** FR-BILL-01, FR-BILL-04, FR-BILL-05, FR-BILL-07
**URD refs:** US-060, US-063

---

### 14. `invoices`
Monthly invoices. One row per user per billing period.

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_invoice_id VARCHAR(100),
  stripe_invoice_number VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  currency CHAR(3) DEFAULT 'USD',
  status VARCHAR(20) NOT NULL,               -- draft | open | paid | void | uncollectible
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  pdf_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_invoices_user ON invoices(user_id, created_at DESC);
```

**SRS refs:** FR-BILL-06
**URD refs:** US-062

---

### 15. `refresh_tokens`
Stores active refresh tokens for JWT session management.

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,    -- SHA-256 of the token
  family VARCHAR(255) NOT NULL,               -- token family for rotation detection
  device_info VARCHAR(255),                  -- user agent / device fingerprint
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE revoked_at IS NULL;
```

**SRS refs:** FR-AUTH-05 (30-day expiry), FR-AUTH-10 (invalidate on password change)
**Security:** SR-02 (supports JWT rotation)

---

### 16. `api_keys`
Programmatic access keys for API users (Persona 4).

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,                -- user-assigned label
  key_prefix VARCHAR(12) NOT NULL,            -- first 8 chars, stored in plaintext for display
  key_hash VARCHAR(255) NOT NULL,             -- bcrypt hash of full key
  scopes TEXT[] NOT NULL DEFAULT '{sms:send,calls:read}',  -- permission scopes
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_api_keys_user ON api_keys(user_id);
```

**SRS refs:** SR-08 (keys stored hashed, never returned plaintext after creation)
**URD refs:** Persona 4 (API User)

---

### 17. `audit_logs`
Immutable audit trail for admin actions and security events.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,              -- e.g., 'user.created', 'number.provisioned', 'admin.plan_changed'
  resource_type VARCHAR(50),                 -- e.g., 'user', 'phone_number', 'campaign'
  resource_id UUID,                          -- ID of the affected resource
  details JSONB,                             -- full context of the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
```

**SRS refs:** SR-09 (maintain audit log for all admin actions)

---

### 18. `email_verification_tokens`
One-time tokens sent via email for account verification.

```sql
CREATE TABLE email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_email_verify_email ON email_verification_tokens(email);
```

**SRS refs:** FR-AUTH-03
**URD refs:** US-002

---

### 19. `password_reset_tokens`
One-time tokens sent via email for password reset.

```sql
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,           -- typically 1 hour
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_password_reset_email ON password_reset_tokens(email);
```

**SRS refs:** FR-AUTH-09
**URD refs:** US-006

---

### 20. `otp_codes`
Short-lived SMS OTP codes for phone-based login.

```sql
CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,                -- E.164
  code_hash VARCHAR(255) NOT NULL,           -- bcrypt hash of 6-digit code
  action VARCHAR(20) NOT NULL,               -- 'login' | 'verify_phone'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,           -- typically 5 minutes
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_otp_phone_action ON otp_codes(phone, action, created_at DESC);
```

**SRS refs:** FR-AUTH-04

---

### 21. `message_templates`
Reusable message templates for business users.

```sql
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  body TEXT NOT NULL,
  variables TEXT[],                          -- e.g., {customer_name}, {order_number}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_message_templates_user ON message_templates(user_id);
```

**SRS refs:** FR-MSG-11
**URD refs:** US-024

---

### 22. `dnc_list`
Do-Not-Call list. Numbers the user has opted out or that are legally blocked.

```sql
CREATE TABLE dnc_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,                -- E.164
  source VARCHAR(50) NOT NULL,               -- 'manual' | 'csv_import' | 'campaign_opt_out' | 'system_tcpa'
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, phone)
);
CREATE INDEX idx_dnc_user ON dnc_list(user_id);
CREATE INDEX idx_dnc_phone ON dnc_list(phone);
```

**SRS refs:** FR-PD-11 (detect and skip DNC numbers)
**URD refs:** US-049
**Compliance:** TCPA requirement

---

## High-Frequency Lookup Indexes

```sql
-- Messages
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_provider_sid ON messages(provider_sid);
CREATE INDEX idx_messages_status ON messages(status) WHERE status = 'queued';

-- Calls
CREATE INDEX idx_calls_user_created ON calls(user_id, created_at DESC);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_provider_sid ON calls(provider_call_sid);

-- Phone Numbers
CREATE INDEX idx_phone_numbers_user ON phone_numbers(user_id) WHERE status = 'active';
CREATE INDEX idx_phone_numbers_number ON phone_numbers(number);   -- webhook lookup: find owner by DID
CREATE INDEX idx_phone_numbers_provider ON phone_numbers(provider);

-- Conversations
CREATE INDEX idx_conversations_user ON conversations(user_id, last_message_at DESC);

-- Campaigns
CREATE INDEX idx_campaigns_user ON campaigns(user_id, created_at DESC);
CREATE INDEX idx_campaigns_status ON campaigns(status) WHERE status IN ('running', 'paused');
```

---

## Data Retention Policy

| Data | Retention | Source |
|------|-----------|--------|
| Message history | 2 years | SRS §6.2 |
| Call recordings | 90 days (configurable up to 1 year on Business plan) | SRS §6.2 |
| CDRs | 5 years (regulatory) | SRS §6.2 |
| Deleted user data | Purged within 30 days (GDPR) | SRS §6.2 |
| OTP codes | 5 minutes | FR-AUTH-04 |
| Password reset tokens | 1 hour | Standard security practice |
| Email verification tokens | 24 hours | Standard practice |
| Refresh tokens | 30 days (or until revoked) | FR-AUTH-05 |
| API keys | Until revoked or expired | SR-08 |
| Audit logs | 5 years (or per regulatory requirement) | SR-09 |

---

## Provider-Agnostic Columns

Per PAL §7 and PAL §2 design principle on provider-neutral data model, the following tables carry `provider` and provider-specific SID columns:

| Table | Provider Column | SID Column | Default |
|-------|----------------|------------|---------|
| `phone_numbers` | `provider` | `provider_sid` | `'twilio'` |
| `messages` | `provider` | `provider_sid` | `'twilio'` |
| `calls` | `provider` | `provider_call_sid` | `'twilio'` |

This ensures historical records remain correctly attributed after a future provider switch, and supports multi-provider routing in Phase 4 (PAL §11).

---

## Migration from Pre-PAL Schema

If migrating from the original v1.0 schema that used `twilio_sid` naming:

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

---

## Table Count Summary

| # | Table | Primary Purpose |
|---|-------|-----------------|
| 1 | `users` | Core accounts |
| 2 | `phone_numbers` | Virtual DIDs |
| 3 | `conversations` | Message threads |
| 4 | `messages` | SMS/MMS records |
| 5 | `calls` | Call detail records |
| 6 | `voicemails` | Recordings + transcripts |
| 7 | `contacts` | Address book |
| 8 | `contact_phones` | Contact phone numbers |
| 9 | `campaigns` | Power dialer campaigns |
| 10 | `campaign_contacts` | Campaign contact list |
| 11 | `plans` | Subscription plan definitions |
| 12 | `subscriptions` | User-plan assignments |
| 13 | `usage_records` | Monthly usage tracking |
| 14 | `invoices` | Billing invoices |
| 15 | `refresh_tokens` | JWT session management |
| 16 | `api_keys` | API authentication |
| 17 | `audit_logs` | Admin audit trail |
| 18 | `email_verification_tokens` | Email verification |
| 19 | `password_reset_tokens` | Password reset |
| 20 | `otp_codes` | Phone OTP login |
| 21 | `message_templates` | Reusable SMS templates |
| 22 | `dnc_list` | Do-Not-Call registry |

**Total: 22 tables**

---

*Generated from SDD §5, SRS §6, PAL §7, API Reference — all tables traceable to specific functional requirements.*
