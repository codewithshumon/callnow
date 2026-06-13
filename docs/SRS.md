# Software Requirements Specification (SRS)
## VoiceLink — International Calling & Messaging Platform

| Field | Detail |
|---|---|
| Document Version | 1.1 |
| Status | Draft |
| Stack | Next.js · NestJS · Go Echo (Power Dialer) |
| Coverage | USA · Canada · Europe · All English-speaking countries |

> **Note:** This document incorporates corrections from the Telephony Provider Abstraction Layer (PAL) addendum (v1.0). Specifically: §4.3 now reflects the PAL provider list accurately; §8.2 assumptions have been updated; and FR-CALL-08 notes the external STT fallback requirement.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Database Requirements](#6-database-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Constraints & Assumptions](#8-constraints--assumptions)

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the complete software requirements for VoiceLink, a web and mobile-compatible platform enabling international calling, SMS/MMS messaging, and automated power dialing. It serves as the binding technical contract between stakeholders, developers, and QA teams.

### 1.2 Scope

VoiceLink allows users to:

- Register a virtual phone number (USA, Canada, UK, Australia, and other English-speaking regions)
- Send and receive SMS/MMS messages internationally
- Make and receive VoIP calls over WebRTC
- Run automated power dialing campaigns from CSV contact lists
- Manage call logs, voicemail, and message history

### 1.3 Definitions

| Term | Meaning |
|---|---|
| PSTN | Public Switched Telephone Network — the traditional phone network |
| VoIP | Voice over IP — calls routed over the internet |
| SIP | Session Initiation Protocol — standard for initiating VoIP calls |
| WebRTC | Web Real-Time Communication — browser-native audio/video |
| Power Dialer | Automated system that dials numbers from a list sequentially or concurrently |
| DID | Direct Inward Dialing — a virtual phone number |
| CDR | Call Detail Record — log of a completed call |
| E.164 | International phone number format standard (e.g., +14155551234) |
| TTS | Text-to-Speech — automated voice generation |
| PAL | Telephony Provider Abstraction Layer — VoiceLink's provider-agnostic interface for all telephony operations |

### 1.4 References

- VoiceLink Telephony Provider Abstraction Layer (PAL) Addendum v1.0
- WebRTC W3C Specification: https://www.w3.org/TR/webrtc/
- RFC 3261 — SIP Protocol
- GDPR Regulation (EU) 2016/679
- TCPA — Telephone Consumer Protection Act (USA)

---

## 2. Overall Description

### 2.1 Product Perspective

VoiceLink is a standalone SaaS platform. It communicates with telephony providers via the PAL for PSTN connectivity, and uses WebRTC for browser-based calling. It does not require users to install native apps — everything runs in the browser.

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                        │
│              Next.js Frontend (WebRTC)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTPS / WebSocket
┌───────────────────────▼─────────────────────────────────┐
│              NestJS API Gateway                         │
│   Auth · Messaging · Calling · Numbers · Webhooks       │
└──────┬──────────┬──────────────┬───────────────┬────────┘
       │          │              │               │
  PostgreSQL   Redis         Go Echo        Telephony PAL
  (primary)   (cache/        (Power         (Twilio active
               queue)        Dialer)         in v1)
```

### 2.2 Product Functions (Summary)

- User registration, authentication, and profile management
- Virtual phone number provisioning and management
- Real-time SMS/MMS send and receive
- Browser-based VoIP calling (WebRTC + SIP)
- Voicemail recording and playback
- Power dialer — CSV upload, campaign management, auto-calling
- Call recording (where legally permitted)
- Contact book management
- Billing and usage dashboard

### 2.3 User Classes

| Class | Description |
|---|---|
| Standard User | Personal use — messaging and calling |
| Business User | Team accounts, multiple numbers, power dialer access |
| Admin | Platform administrator — user management, billing oversight |
| API User | Developers accessing via REST API with API keys |

### 2.4 Operating Environment

- Frontend: Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Backend: Linux containers (Docker on Kubernetes or Fly.io)
- Database: PostgreSQL 15+, Redis 7+
- CDN: Cloudflare (global edge)
- Telephony: Provider-agnostic via PAL (Twilio active in v1; Vonage, Bandwidth, Plivo, Telnyx as fully interchangeable providers)
- STUN/TURN: coturn self-hosted or provider-supplied NAT traversal

---

## 3. System Features

### 3.1 User Authentication

**Priority:** Critical

#### 3.1.1 Description
Users must be able to register and authenticate securely. Authentication supports email/password and phone number OTP.

#### 3.1.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR-AUTH-01 | The system shall allow users to register with email address and password |
| FR-AUTH-02 | Passwords shall be minimum 8 characters with at least one number and one special character |
| FR-AUTH-03 | The system shall send an email verification link upon registration |
| FR-AUTH-04 | The system shall support login via phone number + SMS OTP |
| FR-AUTH-05 | The system shall issue JWT access tokens (15-minute expiry) and refresh tokens (30-day expiry) |
| FR-AUTH-06 | The system shall support Google OAuth 2.0 login |
| FR-AUTH-07 | The system shall enforce rate limiting of 5 failed login attempts per 15 minutes per IP |
| FR-AUTH-08 | The system shall support two-factor authentication (TOTP via authenticator app) |
| FR-AUTH-09 | Users shall be able to reset their password via email link |
| FR-AUTH-10 | All active sessions shall be invalidated upon password change |

---

### 3.2 Virtual Phone Number Management

**Priority:** Critical

#### 3.2.1 Description
Users can provision virtual DID numbers in supported countries and manage them from their dashboard.

#### 3.2.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR-NUM-01 | The system shall allow users to search available numbers by country and area code |
| FR-NUM-02 | Supported countries shall include USA, Canada, UK, Australia, Ireland, New Zealand, and South Africa |
| FR-NUM-03 | The system shall provision a selected number via the active telephony provider within 10 seconds |
| FR-NUM-04 | Users shall be able to hold up to 5 numbers on a standard plan |
| FR-NUM-05 | The system shall display number capabilities (SMS, voice, MMS) before purchase |
| FR-NUM-06 | The system shall support number porting (bring your own number) |
| FR-NUM-07 | Users shall be able to release (delete) a number from their account |
| FR-NUM-08 | Released numbers shall enter a 7-day grace period before being returned to the pool |
| FR-NUM-09 | The system shall support toll-free numbers (800, 888, 877, etc.) |
| FR-NUM-10 | Number assignments shall be stored with E.164 formatting |

---

### 3.3 SMS / MMS Messaging

**Priority:** Critical

#### 3.3.1 Description
Users can send and receive text and media messages to/from any phone number worldwide.

#### 3.3.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR-MSG-01 | The system shall allow users to send SMS to any E.164 phone number |
| FR-MSG-02 | The system shall deliver inbound SMS to the correct user in real time via WebSocket |
| FR-MSG-03 | SMS messages shall be limited to 1600 characters (auto-split to segments) |
| FR-MSG-04 | The system shall support MMS (images, audio, video up to 5MB) |
| FR-MSG-05 | The system shall display message delivery status: sent, delivered, failed |
| FR-MSG-06 | Message history shall be stored and paginated (50 messages per page) |
| FR-MSG-07 | The system shall support group SMS (up to 10 recipients) |
| FR-MSG-08 | Users shall be able to delete messages from their view |
| FR-MSG-09 | The system shall support scheduled message sending |
| FR-MSG-10 | Inbound messages to an unowned number shall be rejected with a 404 |
| FR-MSG-11 | The system shall support message templates for business users |
| FR-MSG-12 | The system shall provide read receipts where carrier supports it |

---

### 3.4 VoIP Calling

**Priority:** Critical

#### 3.4.1 Description
Users can make and receive calls from the browser using WebRTC. Calls connect to real phone numbers via the active telephony provider's PSTN gateway.

#### 3.4.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR-CALL-01 | The system shall allow outbound calls to any E.164 number in supported countries |
| FR-CALL-02 | The system shall ring the user's browser when an inbound call arrives |
| FR-CALL-03 | The system shall support call hold and resume |
| FR-CALL-04 | The system shall support call transfer (blind and attended) |
| FR-CALL-05 | The system shall support conference calling (up to 10 participants) |
| FR-CALL-06 | The system shall record calls when enabled by the user (with GDPR-compliant disclosure) |
| FR-CALL-07 | The system shall route missed calls to voicemail |
| FR-CALL-08 | Voicemail recordings shall be transcribed to text. When the active telephony provider supports transcription natively (e.g., Twilio), the provider's built-in API shall be used. When the active provider does not support native transcription (e.g., Vonage, Bandwidth, Plivo, Telnyx), the backend shall retrieve the recording and submit it to an external speech-to-text service (e.g., OpenAI Whisper API) to produce the transcript. |
| FR-CALL-09 | The system shall display real-time call duration |
| FR-CALL-10 | The system shall support DTMF (keypad tones) during a call |
| FR-CALL-11 | The system shall store CDRs for every call including duration, direction, cost, and status |
| FR-CALL-12 | The system shall support call forwarding to an external number |
| FR-CALL-13 | Users shall be able to set custom caller ID (from owned numbers only) |
| FR-CALL-14 | The system shall support call waiting (second inbound call notification) |

---

### 3.5 Power Dialer

**Priority:** High

#### 3.5.1 Description
Business users can upload a CSV file of phone numbers and run automated dialing campaigns. The Power Dialer is implemented as a separate Go Echo microservice.

#### 3.5.2 Functional Requirements

| ID | Requirement |
|---|---|
| FR-PD-01 | The system shall accept CSV uploads with columns: phone, name, notes (name and notes optional) |
| FR-PD-02 | The system shall validate all phone numbers in the CSV before starting a campaign |
| FR-PD-03 | Invalid numbers shall be flagged in a pre-campaign validation report |
| FR-PD-04 | The system shall support configurable concurrency: 1 to 10 simultaneous calls |
| FR-PD-05 | The system shall support configurable delay between calls (0–60 seconds) |
| FR-PD-06 | The system shall allow campaigns to be paused, resumed, and stopped |
| FR-PD-07 | The system shall display real-time campaign progress (dialed, answered, failed, remaining) |
| FR-PD-08 | The system shall log the outcome of every call attempt (answered, no-answer, busy, failed) |
| FR-PD-09 | Campaign results shall be exportable as CSV |
| FR-PD-10 | The system shall support scheduled campaigns (start at a specific date/time) |
| FR-PD-11 | The system shall detect and skip do-not-call (DNC) numbers |
| FR-PD-12 | The system shall support voicemail drop (pre-recorded message on no-answer) |
| FR-PD-13 | The system shall retry failed/no-answer numbers up to a configurable number of times |
| FR-PD-14 | Campaigns shall respect calling hours (configurable per timezone) |
| FR-PD-15 | The system shall limit campaigns to numbers in legally compliant regions |

---

### 3.6 Contact Management

**Priority:** Medium

| ID | Requirement |
|---|---|
| FR-CON-01 | Users shall be able to add, edit, and delete contacts |
| FR-CON-02 | Contacts shall store: name, phone numbers (multiple), email, notes, tags |
| FR-CON-03 | Users shall be able to import contacts from CSV |
| FR-CON-04 | Users shall be able to search contacts by name or number |
| FR-CON-05 | The system shall auto-match inbound calls/messages to existing contacts |
| FR-CON-06 | Contacts shall support custom tags for segmentation |

---

### 3.7 Billing & Usage

**Priority:** High

| ID | Requirement |
|---|---|
| FR-BILL-01 | The system shall track usage per user: call minutes, SMS sent, SMS received, numbers held |
| FR-BILL-02 | The system shall support subscription plans (Free, Pro, Business) |
| FR-BILL-03 | The system shall integrate Stripe for subscription billing |
| FR-BILL-04 | Users shall receive email alerts at 80% and 100% of plan limits |
| FR-BILL-05 | The system shall display a real-time usage dashboard |
| FR-BILL-06 | Invoices shall be generated monthly and available for download as PDF |
| FR-BILL-07 | The system shall support prepaid credit top-up for pay-as-you-go usage |

---

## 4. External Interface Requirements

### 4.1 User Interface

- The frontend shall be a responsive web application built with Next.js 14 (App Router)
- The UI shall be usable on screens from 375px (mobile) to 2560px (desktop)
- The application shall achieve a Lighthouse accessibility score of 90+
- Core actions (dial, send message) shall be reachable within 2 taps/clicks from the home screen

### 4.2 API Interface

- The NestJS backend shall expose a RESTful API versioned under `/api/v1/`
- WebSocket connections shall be established at `wss://api.voicelink.io/ws`
- All API responses shall follow the JSON:API structure
- The API shall be documented via OpenAPI 3.0 (auto-generated via Swagger)

### 4.3 Third-Party Integrations

All telephony operations (voice, SMS/MMS, number provisioning) are abstracted behind the PAL. The active provider is selected via configuration with no code changes required to switch. See the PAL addendum for the full provider interface contract, capability matrix, and phasing plan.

| Service | Purpose | Interface |
|---|---|---|
| Telephony PAL — Twilio (v1 active) | Outbound/inbound calls, SMS/MMS, DID provisioning | REST API + Webhooks via PAL |
| Telephony PAL — Vonage | Fully interchangeable alternative provider | REST API + Webhooks via PAL |
| Telephony PAL — Bandwidth | Fully interchangeable alternative provider | REST API + Webhooks via PAL |
| Telephony PAL — Plivo | Fully interchangeable alternative provider | REST API + Webhooks via PAL |
| Telephony PAL — Telnyx | Fully interchangeable alternative provider | REST API + Webhooks via PAL |
| Stripe | Subscription billing | REST API + Webhooks |
| AWS S3 / Cloudflare R2 | Media storage (MMS, voicemail, recordings) | S3-compatible API |
| SendGrid | Transactional email | REST API |
| External STT (e.g., OpenAI Whisper) | Voicemail transcription fallback for non-Twilio providers | REST API |
| coturn | STUN/TURN server for WebRTC NAT traversal | STUN/TURN protocol |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|---|---|
| NFR-PERF-01 | API response time shall be < 200ms at p95 for read endpoints |
| NFR-PERF-02 | API response time shall be < 500ms at p95 for write endpoints |
| NFR-PERF-03 | WebSocket message delivery shall be < 100ms |
| NFR-PERF-04 | Call setup time (from dial to ringing) shall be < 3 seconds |
| NFR-PERF-05 | The system shall support 10,000 concurrent WebSocket connections |
| NFR-PERF-06 | The Power Dialer shall support campaigns of up to 100,000 contacts |
| NFR-PERF-07 | SMS delivery to user UI shall be < 2 seconds from receipt |

### 5.2 Availability

| ID | Requirement |
|---|---|
| NFR-AVAIL-01 | The platform shall maintain 99.9% uptime (< 8.7 hours downtime/year) |
| NFR-AVAIL-02 | Planned maintenance windows shall not exceed 30 minutes and be announced 48 hours in advance |
| NFR-AVAIL-03 | Database shall have automated daily backups with 30-day retention |
| NFR-AVAIL-04 | The system shall implement health check endpoints for all services |

### 5.3 Scalability

| ID | Requirement |
|---|---|
| NFR-SCALE-01 | The backend shall scale horizontally via Kubernetes HPA |
| NFR-SCALE-02 | The system shall handle 10× traffic spikes without manual intervention |
| NFR-SCALE-03 | The Power Dialer shall scale independently of the main API |
| NFR-SCALE-04 | Database read replicas shall be used for reporting queries |

### 5.4 Usability

| ID | Requirement |
|---|---|
| NFR-USE-01 | A new user shall be able to send their first message within 3 minutes of registration |
| NFR-USE-02 | The interface shall support English as the primary language |
| NFR-USE-03 | Error messages shall be human-readable and suggest corrective actions |
| NFR-USE-04 | The app shall work without JavaScript disabled (SSR fallbacks via Next.js) |

---

## 6. Database Requirements

### 6.1 Core Tables

| Table | Description |
|---|---|
| `users` | User accounts, credentials, profile |
| `phone_numbers` | Provisioned DID numbers per user (includes `provider` and `provider_sid` columns) |
| `conversations` | Message thread between two parties |
| `messages` | Individual SMS/MMS messages (includes `provider` and `provider_sid` columns) |
| `calls` | Call detail records (includes `provider` and `provider_call_sid` columns) |
| `voicemails` | Voicemail recordings and transcripts |
| `contacts` | User address book |
| `campaigns` | Power dialer campaigns |
| `campaign_contacts` | Individual contacts within a campaign |
| `plans` | Subscription plan definitions |
| `subscriptions` | User → plan assignments |
| `usage_records` | Per-user monthly usage tracking |

### 6.2 Data Retention

- Message history: 2 years
- Call recordings: 90 days (user-configurable up to 1 year on Business plan)
- CDRs: 5 years (regulatory requirement)
- Deleted user data: purged within 30 days (GDPR compliance)

---

## 7. Security Requirements

| ID | Requirement |
|---|---|
| SR-01 | All passwords shall be hashed using bcrypt with a minimum cost factor of 12 |
| SR-02 | JWT secrets shall be rotated every 90 days |
| SR-03 | All API endpoints shall require authentication except /auth/register and /auth/login |
| SR-04 | The system shall implement CORS with an explicit allowlist of origins |
| SR-05 | All telephony provider webhooks shall be validated using the active provider's signature verification mechanism via the PAL |
| SR-06 | PII (phone numbers, names) shall be encrypted at rest using AES-256 |
| SR-07 | The system shall implement OWASP Top 10 protections |
| SR-08 | API keys shall be stored hashed and never returned in plaintext after creation |
| SR-09 | The system shall maintain an audit log for all admin actions |
| SR-10 | Call recordings shall be stored in private S3 buckets with signed URL access only |

---

## 8. Constraints & Assumptions

### 8.1 Constraints

- The system must comply with TCPA regulations for automated calling in the USA
- GDPR consent must be obtained before storing call recordings for EU numbers
- Power Dialer campaigns may only run between 8 AM and 9 PM in the recipient's local timezone (TCPA)
- Twilio imposes rate limits: 100 SMS/second per account by default (limits vary per provider)
- WebRTC requires HTTPS in production (browser security requirement)
- Not all providers support MMS in all regions; the PAL capability flags govern graceful degradation

### 8.2 Assumptions

- All telephony operations are routed through the PAL. Twilio is the active v1 implementation; switching to another provider requires only credential and environment variable changes.
- Vonage, Bandwidth, Plivo, and Telnyx are fully interchangeable providers — not mere fallbacks. They are implemented as stubs in v1 and will be activated in subsequent phases per the PAL phasing plan.
- Voicemail transcription for non-Twilio providers requires an external STT service. The development team will confirm the chosen STT service (e.g., OpenAI Whisper) before Phase 2 provider work begins.
- Users have a stable broadband connection (minimum 1 Mbps for voice calls)
- The development team has access to Twilio test credentials for v1
- Stripe is available in all target markets
- The platform will initially support English language only

---

*Document Owner: Engineering Lead | Review Cycle: Per sprint | Next Review: Before development kickoff*