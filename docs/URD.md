# User Requirements Document (URD)
## VoiceLink — International Calling & Messaging Platform

| Field | Detail |
|---|---|
| Document Version | 1.0 |
| Status | Draft |
| Audience | Product, Design, Engineering, Stakeholders |

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [User Personas](#2-user-personas)
3. [User Stories](#3-user-stories)
4. [Use Cases](#4-use-cases)
5. [User Journey Maps](#5-user-journey-maps)
6. [Acceptance Criteria](#6-acceptance-criteria)
7. [Out of Scope](#7-out-of-scope)

---

## 1. Introduction

### 1.1 Purpose

This URD captures what real users need from VoiceLink — written from the user's perspective, not the system's. Where the SRS defines *what the system shall do*, this document defines *why users need it* and *how they expect to experience it*.

### 1.2 Background

Users need to communicate internationally without paying carrier international rates. Businesses need to contact leads at scale without expensive dialing hardware or software. VoiceLink solves both problems in a single browser-based platform.

### 1.3 How to Read This Document

Each user story follows the format:

> **As a** [persona], **I want to** [action], **so that** [benefit].

Acceptance criteria define the exact conditions under which a story is "done."

---

## 2. User Personas

### Persona 1 — Sarah, the Remote Worker

> **Age:** 31 | **Location:** London, UK | **Tech Level:** Medium

Sarah works remotely for a US company. She needs a US phone number to receive work calls and SMS from American clients without giving out her personal UK number. She uses the app daily for calls and messaging.

**Goals:**
- Have a real US number that clients can call or text
- Take calls from her laptop browser without needing a SIM card
- Keep work and personal communication separate

**Pain Points:**
- International calling is expensive on her UK plan
- Clients are confused by her UK number
- She misses calls when her phone is away

---

### Persona 2 — Marcus, the Sales Manager

> **Age:** 44 | **Location:** Texas, USA | **Tech Level:** Medium-High

Marcus runs a sales team of 8 people. He needs to run calling campaigns against lead lists imported from their CRM. Speed and reliability matter — his team makes 200+ calls per day.

**Goals:**
- Upload a CSV of leads and have the system dial them automatically
- See a live dashboard of campaign progress
- Pause campaigns during lunch or after hours
- Export results back to the CRM

**Pain Points:**
- Current dialing software is expensive and requires installation
- No easy way to track who answered vs. voicemail
- His team wastes time manually dialing numbers

---

### Persona 3 — Priya, the Small Business Owner

> **Age:** 38 | **Location:** Toronto, Canada | **Tech Level:** Low-Medium

Priya runs a small e-commerce business. She wants a dedicated business number for customer support without paying for a phone line. She mainly uses SMS to update customers on orders.

**Goals:**
- Have a professional-looking Canadian business number
- Send and receive customer SMS from her laptop
- Not miss customer messages when she's at her desk

**Pain Points:**
- Her personal number feels unprofessional
- She can't keep up with SMS on her phone while working
- She needs message history to resolve disputes

---

### Persona 4 — Dev Team (API User)

> **Age:** 27 | **Location:** Remote | **Tech Level:** Expert

A developer integrating VoiceLink into their company's internal tooling. They need programmatic access to send SMS and trigger calls via API.

**Goals:**
- Simple, well-documented REST API
- API key management with scopes
- Webhook delivery for inbound events
- Sandbox environment for testing

---

## 3. User Stories

### 3.1 Onboarding & Registration

| ID | Story | Priority |
|---|---|---|
| US-001 | As a new user, I want to sign up with my email and password so I can create my account | Must Have |
| US-002 | As a new user, I want to verify my email address so the platform knows I'm real | Must Have |
| US-003 | As a new user, I want to sign up with Google so I don't need to remember another password | Should Have |
| US-004 | As a returning user, I want to log in with a 6-digit SMS code so I don't need to remember my password | Should Have |
| US-005 | As a user, I want to enable two-factor authentication so my account is more secure | Should Have |
| US-006 | As a user, I want to reset my password by email so I can regain access if I forget it | Must Have |

### 3.2 Phone Number Management

| ID | Story | Priority |
|---|---|---|
| US-010 | As Sarah, I want to search for available US phone numbers by area code so I can get a number that looks local to my clients | Must Have |
| US-011 | As Sarah, I want to pick and activate a number in under 30 seconds so I can start using it immediately | Must Have |
| US-012 | As Priya, I want to provision a Canadian business number so my customers see a local number | Must Have |
| US-013 | As a user, I want to see what capabilities (SMS, voice, MMS) a number has before I buy it so there are no surprises | Must Have |
| US-014 | As a user, I want to release a number I no longer need so I stop being billed for it | Must Have |
| US-015 | As a Business user, I want to hold multiple numbers so different team members or campaigns can have their own number | Should Have |
| US-016 | As a user, I want to port my existing phone number to VoiceLink so I don't have to change my number | Nice to Have |

### 3.3 Messaging

| ID | Story | Priority |
|---|---|---|
| US-020 | As Sarah, I want to send an SMS to any phone number from my VoiceLink number so I can message clients | Must Have |
| US-021 | As Priya, I want to see inbound SMS appear instantly in my browser so I don't miss customer messages | Must Have |
| US-022 | As a user, I want to see whether my sent message was delivered so I know it reached the recipient | Must Have |
| US-023 | As a user, I want to send a photo or document via MMS so I can share files without email | Should Have |
| US-024 | As a Business user, I want to use message templates so I can reply quickly to common questions | Should Have |
| US-025 | As a user, I want to search my message history so I can find a specific conversation | Should Have |
| US-026 | As a user, I want to schedule a message to send later so I can prepare communications in advance | Nice to Have |

### 3.4 Calling

| ID | Story | Priority |
|---|---|---|
| US-030 | As Sarah, I want to call any US or UK number from my browser so I don't need my phone nearby | Must Have |
| US-031 | As a user, I want my browser to ring when someone calls my VoiceLink number so I never miss a call | Must Have |
| US-032 | As a user, I want to put a call on hold so I can look something up without hanging up | Must Have |
| US-033 | As a user, I want missed calls to go to voicemail with a custom greeting so callers can leave a message | Must Have |
| US-034 | As a user, I want to read a text transcript of my voicemail so I can understand messages without playing audio | Should Have |
| US-035 | As Marcus, I want to record calls (with disclosure) so I can review conversations later | Should Have |
| US-036 | As a user, I want to transfer a call to another number so I can hand off to a colleague | Should Have |
| US-037 | As a user, I want to see my full call history with duration and cost so I can track my usage | Must Have |
| US-038 | As a Business user, I want to set up a conference call with multiple participants so my team can join remotely | Should Have |

### 3.5 Power Dialer

| ID | Story | Priority |
|---|---|---|
| US-040 | As Marcus, I want to upload a CSV of leads so I can start a calling campaign without manual data entry | Must Have |
| US-041 | As Marcus, I want the system to validate phone numbers in my CSV before dialing so I don't waste time on bad numbers | Must Have |
| US-042 | As Marcus, I want to configure how many calls run simultaneously so I can match my team's capacity | Must Have |
| US-043 | As Marcus, I want to see a live dashboard showing dialed, answered, and remaining contacts so I know campaign progress | Must Have |
| US-044 | As Marcus, I want to pause and resume a campaign so I can stop during lunch or after business hours | Must Have |
| US-045 | As Marcus, I want to set a delay between calls so I don't overwhelm my team with back-to-back connections | Should Have |
| US-046 | As Marcus, I want the system to leave a pre-recorded voicemail when no one answers so I don't waste agent time | Should Have |
| US-047 | As Marcus, I want to export campaign results to CSV so I can import outcomes back to my CRM | Must Have |
| US-048 | As Marcus, I want to schedule a campaign to start at a specific time so it begins automatically | Should Have |
| US-049 | As Marcus, I want the system to skip numbers on my DNC list so I stay legally compliant | Must Have |

### 3.6 Contacts

| ID | Story | Priority |
|---|---|---|
| US-050 | As a user, I want to save a contact with a name so inbound calls and messages show the contact name | Must Have |
| US-051 | As a user, I want to import contacts from a CSV so I don't have to add them one by one | Should Have |
| US-052 | As a user, I want to tag contacts so I can group them for campaigns | Should Have |

### 3.7 Billing & Account

| ID | Story | Priority |
|---|---|---|
| US-060 | As a user, I want to see how many minutes and messages I've used this month so I know if I'm near my limit | Must Have |
| US-061 | As a user, I want to upgrade or downgrade my plan so I can adjust to my current needs | Must Have |
| US-062 | As a user, I want to download my invoice as PDF so I can expense it | Should Have |
| US-063 | As a user, I want to get an email alert when I reach 80% of my plan usage so I'm not caught off guard | Must Have |

---

## 4. Use Cases

### UC-01: Make an Outbound Call

**Actor:** Sarah (Standard User)
**Preconditions:** Sarah is logged in and has at least one provisioned number with voice capability
**Trigger:** Sarah clicks the dial pad or a contact's call button

**Main Flow:**
1. Sarah opens the dial pad or clicks Call on a contact
2. She selects which of her numbers to call from
3. She enters or confirms the destination number (E.164 format enforced)
4. She clicks Call
5. The system requests microphone permission from the browser
6. The system establishes a WebRTC connection to Twilio
7. The system dials the destination via Twilio PSTN
8. Sarah hears ringing in her browser
9. The recipient answers — the call is connected
10. Sarah sees a live timer and in-call controls (mute, hold, keypad, hang up)
11. Sarah clicks hang up — the call ends
12. A CDR is created and appears in Sarah's call history

**Alternate Flows:**
- 5a: Sarah denies microphone permission → system shows an error explaining that microphone access is required
- 7a: Twilio returns a "Not Reachable" error → system shows "Could not connect the call" toast
- 9a: Recipient doesn't answer → call diverts to recipient's voicemail

---

### UC-02: Run a Power Dialer Campaign

**Actor:** Marcus (Business User)
**Preconditions:** Marcus is logged in with a Business plan. He has a CSV file of leads.
**Trigger:** Marcus navigates to Power Dialer → New Campaign

**Main Flow:**
1. Marcus clicks New Campaign and gives it a name
2. He uploads a CSV file (columns: phone, name, notes)
3. The system validates the CSV — shows a report of valid and invalid numbers
4. Marcus configures campaign settings:
   - Calling number (from his provisioned numbers)
   - Concurrency (1–10 simultaneous calls)
   - Delay between calls (0–60 seconds)
   - Calling hours (e.g., 9 AM–5 PM EST)
   - Retry failed calls: yes/no, max 3 attempts
   - Voicemail drop: upload or select a pre-recorded message
5. Marcus clicks Start Campaign
6. The NestJS API sends the campaign to the Go Power Dialer service
7. The Go service begins dialing contacts from the queue
8. Marcus sees a live dashboard: total, dialed, answered, failed, remaining
9. When all contacts are processed, the campaign status changes to Completed
10. Marcus clicks Export Results → downloads a CSV with outcome per contact

**Alternate Flows:**
- 3a: CSV has invalid numbers → system flags them, Marcus can proceed without them or fix the file
- 8a: Marcus clicks Pause → Go service suspends the queue, campaign status becomes Paused
- 8b: Marcus clicks Stop → campaign is terminated, partial results are saved

---

### UC-03: Receive an Inbound SMS

**Actor:** Priya (Small Business Owner)
**Preconditions:** Priya is logged in. A customer has her business number.
**Trigger:** A customer sends an SMS to Priya's VoiceLink number

**Main Flow:**
1. Customer sends SMS to Priya's number
2. Twilio receives the SMS and POSTs a webhook to NestJS
3. NestJS validates the Twilio webhook signature
4. NestJS looks up which user owns this number
5. NestJS stores the message in the database
6. NestJS publishes a WebSocket event to Priya's active browser session
7. Priya sees the new message appear in real time in the correct conversation thread
8. A browser notification appears if Priya is on a different tab
9. Priya clicks the conversation and types a reply
10. Priya's reply is sent via Twilio SMS back to the customer

---

### UC-04: Provision a Phone Number

**Actor:** Any User
**Preconditions:** User is logged in and has an active plan
**Trigger:** User navigates to Numbers → Add Number

**Main Flow:**
1. User selects country (USA, Canada, UK, etc.)
2. User optionally enters a preferred area code
3. System queries Twilio for available numbers matching the criteria
4. System displays up to 20 available numbers with capabilities and monthly cost
5. User selects a number and clicks Provision
6. System creates the number in Twilio and associates it with the user's account
7. System configures Twilio webhooks for voice and SMS on the new number
8. Number appears in the user's number list as Active within 10 seconds

---

## 5. User Journey Maps

### Journey 1: New User → First Message Sent (Target: < 3 minutes)

```
Step 1: Land on homepage          (0:00)
  → Clicks "Get Started Free"

Step 2: Registration form         (0:20)
  → Email + password → Submit
  → Redirected to "Check your email"

Step 3: Email verification        (0:45)
  → User clicks link in email
  → Redirected to onboarding

Step 4: Pick a number             (1:00)
  → Select country → USA
  → See 10 available numbers
  → Click "Get this number"

Step 5: Number provisioned        (1:15)
  → Success screen: "Your number is ready"
  → Taken to messaging dashboard

Step 6: Send first message        (2:30)
  → Click "New Message"
  → Type recipient number
  → Type message text
  → Click Send ✓
```

**Drop-off risks:**
- Email verification delay → mitigate with resend link on verification page
- Too many number options → pre-select recommended number
- Empty state confusion → show onboarding tooltip on first dashboard visit

---

### Journey 2: Sales Manager → Campaign Live

```
Step 1: Login → Navigate to Power Dialer
Step 2: Click "New Campaign"
Step 3: Upload CSV → validation report shown
Step 4: Configure settings (concurrency, hours, voicemail drop)
Step 5: Click "Start" → Campaign goes live
Step 6: Monitor live dashboard
Step 7: Campaign completes → Export results
```

**Key moment:** Step 3 — validation report. This is where users build confidence or lose it. The report must be clear: "842 valid numbers ready to dial. 17 numbers skipped (invalid format). 3 numbers on your DNC list."

---

## 6. Acceptance Criteria

### AC for US-020 (Send SMS)

- [ ] User can type any E.164 phone number in the "To" field
- [ ] User can type a message up to 1600 characters
- [ ] Character count is displayed as user types
- [ ] Clicking Send submits the message
- [ ] Message appears in the conversation thread with status "Sent" within 1 second
- [ ] Status updates to "Delivered" within 30 seconds for deliverable numbers
- [ ] Status updates to "Failed" with a reason if delivery fails
- [ ] An error toast appears if the user tries to send to an invalid number format

### AC for US-031 (Inbound call ringing)

- [ ] When an inbound call arrives, a full-screen overlay appears with caller ID (or "Unknown")
- [ ] The browser tab title changes to "📞 Incoming call..."
- [ ] A browser notification is shown if the user is on another tab
- [ ] The user can Accept or Decline the call from the overlay
- [ ] Accepting connects the call via WebRTC
- [ ] Declining sends the caller to voicemail
- [ ] If the user does not answer within 30 seconds, the call goes to voicemail automatically
- [ ] A missed call notification appears in the call history

### AC for US-040 (Upload CSV for Power Dialer)

- [ ] The upload area accepts .csv files only (other file types are rejected with an error)
- [ ] Files up to 50MB are accepted (roughly 500,000 contacts)
- [ ] The system parses the CSV and identifies a "phone" column (case-insensitive header matching)
- [ ] A validation report is generated within 30 seconds for files up to 10,000 rows
- [ ] The report shows: total rows, valid numbers, invalid numbers, DNC matches
- [ ] Invalid rows are listed with row number and reason
- [ ] User can download the invalid rows as a separate CSV for correction
- [ ] User can proceed with only valid numbers

---

## 7. Out of Scope

The following are explicitly not in scope for v1.0:

- Native iOS or Android apps (web app only)
- WhatsApp, iMessage, or RCS messaging
- Video calling
- AI-powered call transcription beyond Twilio's built-in transcription
- CRM native integrations (Salesforce, HubSpot) — export/import CSV only
- Predictive dialer (dialing before agents are free)
- Interactive Voice Response (IVR) builder
- Multi-language support beyond English
- Number provisioning in non-English-speaking countries

These may be considered for v2.0 based on user feedback.

---

*Document Owner: Product Manager | Stakeholder Sign-off Required Before Development*