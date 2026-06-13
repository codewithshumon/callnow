# VoiceLink Next.js Frontend — Complete Task List

> **Derived from:** SDD §2, URD Use Cases & Journey Maps, API Reference, PAL §9, SRS §4.1
> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Zustand · TanStack Query
> **Current state:** Default Next.js template (`page.tsx` with "To get started")
> **Target:** Complete production-ready VoiceLink web app

---

## Phase 0 — Project Foundation

### 0.1 — Dependencies

- [ ] **0.1.1** State management: `zustand`
- [ ] **0.1.2** Server state & caching: `@tanstack/react-query`
- [ ] **0.1.3** HTTP client: `axios`
- [ ] **0.1.4** WebSocket: `socket.io-client`
- [ ] **0.1.5** WebRTC: `@twilio/voice-sdk` (v1 active), `webrtc-adapter`
- [ ] **0.1.6** Forms & validation: `react-hook-form`, `zod`, `@hookform/resolvers`
- [ ] **0.1.7** UI primitives: `shadcn/ui` (init with `button`, `input`, `card`, `dialog`, `sheet`, `dropdown-menu`, `tabs`, `toast`, `skeleton`, `badge`, `avatar`, `separator`, `tooltip`, `popover`, `command`)
- [ ] **0.1.8** Icons: `lucide-react`
- [ ] **0.1.9** Utilities: `clsx`, `tailwind-merge`, `date-fns`, `react-hot-toast` (or shadcn sonner)
- [ ] **0.1.10** CSV: `papaparse` (client-side parsing for preview)
- [ ] **0.1.11** Phone input: `react-phone-number-input` with `libphonenumber-js`
- [ ] **0.1.12** OTP input: `react-otp-input` or custom
- [ ] **0.1.13** QR code: `qrcode.react` (for 2FA setup)

**Refs:** SDD §2.2, SDD §2.3, PAL §9

### 0.2 — Configuration

- [ ] **0.2.1** Set `NEXT_PUBLIC_API_URL` in `.env` (default `http://localhost:4000`)
- [ ] **0.2.2** Set `NEXT_PUBLIC_WS_URL` in `.env` (default `ws://localhost:4000`)
- [ ] **0.2.3** Configure `next.config.ts` — add `images` domains, API rewrites if needed

**Refs:** SDD §8.1, SDD §8.3

### 0.3 — Base Layout & Theme

- [ ] **0.3.1** Update [layout.tsx](view/src/app/layout.tsx) — metadata title "VoiceLink", add `ThemeProvider`, `QueryClientProvider`, `Toaster`
- [ ] **0.3.2** Set up Tailwind CSS 4 theme — colors, fonts (Inter/Geist), dark mode via `class` strategy
- [ ] **0.3.3** Create `globals.css` — Tailwind directives + custom properties for VoiceLink brand colors
- [ ] **0.3.4** Create responsive breakpoint strategy — mobile 375px → desktop 2560px (SRS §4.1)

**Refs:** SRS §4.1, SDD §2.4

---

## Phase 1 — Core Library Files (All Features Depend On These)

### 1.1 — API Client

- [ ] **1.1.1** Create `src/lib/api.ts` — Axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL + '/api/v1'`
- [ ] **1.1.2** Request interceptor — attach `Authorization: Bearer {accessToken}` from `authStore`
- [ ] **1.1.3** Response interceptor — on 401, attempt refresh via `POST /auth/refresh`, if success → retry original request; if fail → redirect to `/login`, clear auth store
- [ ] **1.1.4** Type-safe API helper functions (generic `get<T>`, `post<T>`, `put<T>`, `patch<T>`, `delete<T>`)

**Refs:** SDD §2.1 (lib/api.ts)

### 1.2 — WebSocket Client

- [ ] **1.2.1** Create `src/lib/websocket.ts` — `socket.io-client` instance connecting to `NEXT_PUBLIC_WS_URL` with `namespace: '/ws'`
- [ ] **1.2.2** Auth handshake — send JWT token on connect via `auth: { token }`
- [ ] **1.2.3** Reconnection logic — exponential backoff, max 5 retries
- [ ] **1.2.4** Typed event emitter wrapper — `onMessageNew`, `onMessageStatus`, `onCallInbound`, `onCallStatus`, `onCampaignProgress`, `onCampaignComplete`
- [ ] **1.2.5** Room management — `joinCampaignRoom(campaignId)`, `leaveCampaignRoom(campaignId)`

**Refs:** SDD §2.1 (lib/websocket.ts), SDD §6.1, API §WebSocket Events

### 1.3 — WebRTC Client (Provider-Agnostic)

- [ ] **1.3.1** Create `src/lib/webrtc.ts` — provider-agnostic `WebRTCClient` wrapper
- [ ] **1.3.2** Implement `initializeCallClient({ token, provider })` — switch on `provider` to load correct SDK (Twilio active in v1) per PAL §9
- [ ] **1.3.3** Implement `initTwilioDevice(token)` — create Twilio `Device`, register, set `codecPreferences: ['opus', 'pcmu']`, `enableDscp: true`
- [ ] **1.3.4** Wire Twilio `Device.on('incoming', call => callStore.setIncomingCall(call))`
- [ ] **1.3.5** Expose `makeCall(params)` — `device.connect({ params })`
- [ ] **1.3.6** Expose `hangUp()` — disconnect active call
- [ ] **1.3.7** Expose `mute()`, `unmute()`, `sendDigits(dtmf)` — call controls
- [ ] **1.3.8** Handle device errors (permission denied, network loss) → show user-friendly toast

**Refs:** SDD §2.3, PAL §9, SDD §6.2

### 1.4 — TypeScript Types

- [ ] **1.4.1** Create `src/lib/types.ts` — shared types for all API responses:
  - `User`, `PhoneNumber`, `Conversation`, `Message`, `Call`, `Voicemail`, `Contact`, `Campaign`, `CampaignContact`, `Plan`, `Subscription`, `Invoice`, `UsageRecord`
  - API envelope types: `ApiResponse<T>`, `PaginatedResponse<T>`
  - WebSocket event types per API §WebSocket Events
  - `CallStatus`, `MessageStatus` enums (VoiceLink normalized values)

**Refs:** SDD §2.1 (lib/types.ts), API Reference (all response shapes)

---

## Phase 2 — State Management (Zustand Stores)

### 2.1 — Auth Store

- [ ] **2.1.1** Create `src/store/authStore.ts`
- [ ] **2.1.2** State: `user: User | null`, `accessToken: string | null`, `refreshToken: string | null`, `isLoading: boolean`
- [ ] **2.1.3** Actions: `login(email, password)`, `register(email, password)`, `loginWithGoogle(idToken)`, `loginWithPhone(phone, code)`, `logout()`, `refreshToken()`, `setUser(user)`
- [ ] **2.1.4** Persist tokens to `localStorage` (or cookies for SSR compatibility) — rehydrate on app load
- [ ] **2.1.5** Computed: `isAuthenticated`, `isEmailVerified`

**Refs:** SDD §2.1 (store/authStore.ts), API §Authentication, URD §3.1

### 2.2 — Call Store

- [ ] **2.2.1** Create `src/store/callStore.ts`
- [ ] **2.2.2** State: `activeCall: { callSid, from, to, status, duration, isMuted, isOnHold } | null`, `incomingCall: { callSid, from, to } | null`, `callHistory: Call[]`
- [ ] **2.2.3** Actions: `setIncomingCall(call)`, `acceptCall()`, `declineCall()`, `startCall(params)`, `endCall()`, `toggleMute()`, `toggleHold()`, `sendDigits(dtmf)`, `updateDuration(seconds)`
- [ ] **2.2.4** Timer effect — start/stop interval for live call duration display

**Refs:** SDD §2.1 (store/callStore.ts), URD UC-01, API §WebSocket Events

### 2.3 — Message Store

- [ ] **2.3.1** Create `src/store/messageStore.ts`
- [ ] **2.3.2** State: `conversations: Conversation[]`, `activeConversationId: string | null`, `messages: Map<string, Message[]>`, `unreadCounts: Map<string, number>`
- [ ] **2.3.3** Actions: `addMessage(conversationId, message)`, `updateMessageStatus(messageId, status)`, `addInboundMessage(conversationId, message)`, `markRead(conversationId)`, `setConversations(list)`

**Refs:** SDD §2.1 (store/messageStore.ts), API §WebSocket Events

---

## Phase 3 — Auth Pages

### 3.1 — Registration Page

- [ ] **3.1.1** Create `src/app/(auth)/register/page.tsx` — SSR strategy (SDD §2.4)
- [ ] **3.1.2** Register form: email, password (with strength indicator per FR-AUTH-02: min 8 chars, 1 number, 1 special), confirm password
- [ ] **3.1.3** Zod schema: email validation, password rules, password match
- [ ] **3.1.4** Submit → `POST /auth/register` → show "Check your email" screen
- [ ] **3.1.5** Google sign-up button (calls `POST /auth/google` with idToken from Google One Tap)
- [ ] **3.1.6** Link to login page
- [ ] **3.1.7** Error handling: email taken, weak password, validation errors → inline field errors + toast

**Refs:** US-001, US-003, API POST /auth/register, URD Journey 1

### 3.2 — Login Page

- [ ] **3.2.1** Create `src/app/(auth)/login/page.tsx` — SSR strategy
- [ ] **3.2.2** Login form: email + password
- [ ] **3.2.3** Submit → `POST /auth/login` → store tokens in `authStore` → redirect to dashboard
- [ ] **3.2.4** If response includes `loginToken` (2FA enabled) → redirect to 2FA verify page
- [ ] **3.2.5** "Login with phone" toggle → switch to phone OTP form
- [ ] **3.2.6** Phone OTP flow: enter phone → `POST /auth/login/phone { action: 'request' }` → show OTP input (6 digits) → `POST /auth/login/phone { action: 'verify' }`
- [ ] **3.2.7** Google login button
- [ ] **3.2.8** "Forgot password?" link
- [ ] **3.2.9** "Create account" link
- [ ] **3.2.10** Rate limit feedback — "Too many attempts. Try again in X minutes."

**Refs:** US-001, US-004, API POST /auth/login, API POST /auth/login/phone

### 3.3 — Email Verification Page

- [ ] **3.3.1** Create `src/app/(auth)/verify-email/page.tsx` — reads `?token=` from URL
- [ ] **3.3.2** Auto-submit `POST /auth/verify-email` on mount with token
- [ ] **3.3.3** Success state → "Email verified! Redirecting to onboarding..."
- [ ] **3.3.4** Error state → "Invalid or expired link. Resend verification email?"
- [ ] **3.3.5** Resend verification button

**Refs:** US-002, API POST /auth/verify-email, URD Journey 1 Step 3

### 3.4 — Password Reset Flow

- [ ] **3.4.1** Create `src/app/(auth)/forgot-password/page.tsx` — email input → `POST /auth/forgot-password` → show "Check your email" always (don't reveal if email exists)
- [ ] **3.4.2** Create `src/app/(auth)/reset-password/page.tsx` — reads `?token=` from URL, new password + confirm → `POST /auth/reset-password` → success toast → redirect to login

**Refs:** US-006, API POST /auth/forgot-password, API POST /auth/reset-password

### 3.5 — 2FA Setup Page

- [ ] **3.5.1** Create `src/app/(dashboard)/settings/security/page.tsx` — "Enable Two-Factor Authentication" button
- [ ] **3.5.2** Call `POST /auth/2fa/enable` → display QR code (`qrcode.react`) + secret text for manual entry
- [ ] **3.5.3** "Verify" step — user enters TOTP code → `POST /auth/2fa/verify` → success with backup codes display
- [ ] **3.5.4** Backup codes copy/download

**Refs:** US-005, API POST /auth/2fa/enable, API POST /auth/2fa/verify

### 3.6 — 2FA Verification Page (During Login)

- [ ] **3.6.1** Create `src/app/(auth)/verify-2fa/page.tsx` — receives `loginToken` via query param or store
- [ ] **3.6.2** 6-digit TOTP input → `POST /auth/2fa/verify { loginToken, code }` → receive tokens → redirect to dashboard

**Refs:** FR-AUTH-08, API POST /auth/2fa/verify

---

## Phase 4 — Dashboard Shell (Authenticated Layout)

### 4.1 — Dashboard Layout

- [ ] **4.1.1** Create `src/app/(dashboard)/layout.tsx` — sidebar + main content area
- [ ] **4.1.2** Auth guard — redirect to `/login` if no valid token (check store, attempt refresh)
- [ ] **4.1.3** WebSocket connection init on mount — call `wsClient.connect(token)`, reconnect on token refresh
- [ ] **4.1.4** WebRTC device init on mount — call `initializeCallClient({ token, provider })` when user is authenticated
- [ ] **4.1.5** Global WebSocket event listeners: `message:new` → update messageStore + show notification toast, `call:inbound` → callStore.setIncomingCall + show full-screen overlay, `campaign:progress` → update campaign view if open
- [ ] **4.1.6** Browser notification permission request on first dashboard visit (for inbound calls/messages when tab is backgrounded)

**Refs:** SDD §2.1 (app/(dashboard)/layout.tsx), URD UC-03 Step 6-8

### 4.2 — Sidebar Component

- [ ] **4.2.1** Create `src/components/layout/Sidebar.tsx`
- [ ] **4.2.2** Navigation links with lucide icons:
  - Messages (MessageSquare) — `/messages`
  - Calls (Phone) — `/calls`
  - Dialer (PhoneCall) — `/dialer`
  - Numbers (Hash) — `/numbers`
  - Contacts (Users) — `/contacts`
  - Billing (CreditCard) — `/billing`
  - Settings (Settings) — `/settings`
- [ ] **4.2.3** Active route highlighting (usePathname)
- [ ] **4.2.4** Collapsible on mobile (hamburger toggle)
- [ ] **4.2.5** User avatar + email at bottom, dropdown: Profile, Logout
- [ ] **4.2.6** Plan badge (Free/Pro/Business)
- [ ] **4.2.7** Usage indicator bar — minutes used / plan limit

**Refs:** SDD §2.1, SRS §4.1 (mobile responsive)

### 4.3 — Top Bar (Mobile)

- [ ] **4.3.1** Mobile-only top bar with hamburger, page title, notification bell

---

## Phase 5 — Messaging Pages

### 5.1 — Conversation List Page

- [ ] **5.1.1** Create `src/app/(dashboard)/messages/page.tsx` — CSR (SDD §2.4)
- [ ] **5.1.2** Fetch conversations via `useQuery('conversations', () => api.get('/conversations'))` with TanStack Query
- [ ] **5.1.3** Create `src/components/messaging/ConversationList.tsx` — scrollable list, each item: contact name (or number), last message preview, timestamp, unread badge
- [ ] **5.1.4** Search bar — filter conversations client-side by name/number
- [ ] **5.1.5** "New Message" button → opens NewMessageDialog
- [ ] **5.1.6** Click conversation → navigate to `/messages/[id]`
- [ ] **5.1.7** Empty state — "No messages yet. Click New Message to start a conversation."
- [ ] **5.1.8** Skeleton loading while fetching

**Refs:** API GET /conversations, URD Journey 1 Step 6

### 5.2 — Conversation Detail Page

- [ ] **5.2.1** Create `src/app/(dashboard)/messages/[id]/page.tsx` — CSR
- [ ] **5.2.2** Fetch messages via `useQuery(['messages', id], () => api.get(`/conversations/${id}/messages`))` with infinite scroll pagination via `useInfiniteQuery`
- [ ] **5.2.3** Create `src/components/messaging/MessageThread.tsx` — scrollable message list
- [ ] **5.2.4** Message bubble component — inbound (left, gray) vs outbound (right, blue), status indicator (queued → sent → delivered ✓✓, failed ❌), timestamp, media attachments (image thumbnail, audio player)
- [ ] **5.2.5** Auto-scroll to bottom on new message
- [ ] **5.2.6** Message status updates via WebSocket `message:status` → update bubble icon in real-time
- [ ] **5.2.7** Inbound messages via WebSocket `message:new` → append to thread, mark conversation active, increment unread
- [ ] **5.2.8** Create `src/components/messaging/MessageInput.tsx` — text input + emoji picker + file attachment (for MMS), character count display (max 1600), send button
- [ ] **5.2.9** Send message → `POST /messages` → optimistically add to thread with status `sending`, update on success with providerSid + `queued` status
- [ ] **5.2.10** Schedule message — date/time picker in input, sets `scheduledAt` on send
- [ ] **5.2.11** Delete message — long press or right-click → "Delete" → `DELETE /messages/:id` → optimistic removal
- [ ] **5.2.12** Conversation header — contact name/number, call button (initiate call to this number), info button
- [ ] **5.2.13** Empty state — "Start the conversation by sending a message below."

**Refs:** API GET /conversations/:id/messages, API POST /messages, SDD §6.1 WebSocket events, URD UC-03, AC for US-020

### 5.3 — New Message Dialog

- [ ] **5.3.1** Create `src/components/messaging/NewMessageDialog.tsx` — dialog/sheet with:
  - "From" dropdown — user's provisioned numbers (phone_numbers with SMS capability)
  - "To" input — E.164 phone number with `react-phone-number-input` (FR-MSG-01)
  - Message body textarea with character count
  - Send button → create conversation + send message → navigate to new conversation
- [ ] **5.3.2** Contact picker — search existing contacts by name/number
- [ ] **5.3.3** Validation: to-number must be valid E.164, from-number must have SMS capability, body required

**Refs:** AC for US-020, URD Journey 1 Step 6

---

## Phase 6 — Calling Pages

### 6.1 — Call History Page

- [ ] **6.1.1** Create `src/app/(dashboard)/calls/page.tsx` — CSR
- [ ] **6.1.2** Fetch calls via `useQuery(['calls'], () => api.get('/calls?page=1&limit=20'))`
- [ ] **6.1.3** Call list — each row: direction icon (↗ outbound / ↙ inbound), contact name/number, status (completed/failed/missed), duration, cost, timestamp
- [ ] **6.1.4** Filter tabs — All / Inbound / Outbound / Missed
- [ ] **6.1.5** Click call → expand with details: recording (if available, play inline), voicemail link
- [ ] **6.1.6** Pagination — load more on scroll
- [ ] **6.1.7** Empty state — "No calls yet. Open the dial pad to make your first call."

**Refs:** API GET /calls, US-037, FR-CALL-11

### 6.2 — Dial Pad Page

- [ ] **6.2.1** Create `src/app/(dashboard)/calls/dialpad/page.tsx` — CSR
- [ ] **6.2.2** Create `src/components/calling/DialPad.tsx` — phone number display (E.164 formatted as user types), DTMF keypad grid (1-9, *, 0, #), backspace, call button
- [ ] **6.2.3** "From" dropdown — user's numbers with voice capability
- [ ] **6.2.4** Call button → `POST /calls/token` → `webrtcClient.makeCall({ to, from })` → show ActiveCallBar
- [ ] **6.2.5** Quick-dial contacts list below dial pad
- [ ] **6.2.6** Recent calls list (last 5 from call history)

**Refs:** URD UC-01, API POST /calls/token, SDD §6.2

### 6.3 — Active Call Bar

- [ ] **6.3.1** Create `src/components/calling/ActiveCallBar.tsx` — persistent bar at bottom of screen during call
- [ ] **6.3.2** Display: contact name/number, live call duration (MM:SS timer), call status
- [ ] **6.3.3** Controls: Mute (toggle), Hold (toggle), Keypad (show DTMF pad), Transfer, Record (with disclosure), Hang Up (red button)
- [ ] **6.3.4** Mute state — red indicator on mute button
- [ ] **6.3.5** Hold state — "On Hold" displayed, blinking indicator
- [ ] **6.3.6** Transfer — opens dialog to select another number/contact, then `POST /calls/:id/transfer`
- [ ] **6.3.7** Expand to full call view — click bar to see full call screen with larger controls
- [ ] **6.3.8** Hang up → `webrtcClient.hangUp()` → bar disappears, CDR created

**Refs:** URD UC-01 Steps 9-11, FR-CALL-03, FR-CALL-04, FR-CALL-06, FR-CALL-09, FR-CALL-10

### 6.4 — Inbound Call Overlay

- [ ] **6.4.1** Create `src/components/calling/InboundCallOverlay.tsx` — full-screen overlay when `call:inbound` WebSocket event fires
- [ ] **6.4.2** Display: caller ID (contact name or number), "Incoming call..." text, ringing animation
- [ ] **6.4.3** Browser tab title → "📞 Incoming call..." (AC for US-031)
- [ ] **6.4.4** Browser notification via Notification API (AC for US-031)
- [ ] **6.4.5** Accept button (green) → connect call via WebRTC → overlay closes → show ActiveCallBar
- [ ] **6.4.6** Decline button (red) → `POST /calls/:id/decline` or send decline TwiML → caller goes to voicemail → overlay closes
- [ ] **6.4.7** Auto-timeout: if user doesn't answer within 30 seconds → call goes to voicemail, overlay closes, missed call in history (AC for US-031)
- [ ] **6.4.8** If user is on another call → show "call waiting" with Accept/Decline for second call (FR-CALL-14)

**Refs:** URD AC for US-031, FR-CALL-02, FR-CALL-14, SDD §6.1

### 6.5 — Voicemail Page

- [ ] **6.5.1** Create `src/app/(dashboard)/voicemails/page.tsx` — or tab within calls page
- [ ] **6.5.2** Fetch voicemails via `GET /voicemails`
- [ ] **6.5.3** Create `src/components/calling/VoicemailPlayer.tsx` — playback of recording URL, audio waveform or progress bar, transcript display below player, mark as read
- [ ] **6.5.4** Unread badge on voicemail list items
- [ ] **6.5.5** Empty state — "No voicemails."

**Refs:** API GET /voicemails, API PATCH /voicemails/:id, US-033, US-034

---

## Phase 7 — Numbers Page

### 7.1 — Numbers Management Page

- [ ] **7.1.1** Create `src/app/(dashboard)/numbers/page.tsx` — SSR + CSR hydration (SDD §2.4)
- [ ] **7.1.2** Server-side fetch of user's current numbers
- [ ] **7.1.3** Number cards — number (E.164 formatted), friendly name, country flag, capabilities badges (Voice ✓, SMS ✓, MMS ✗), provider icon, monthly cost, status badge
- [ ] **7.1.4** Release button → confirmation dialog → `DELETE /numbers/:id` → optimistic removal
- [ ] **7.1.5** "Add Number" button → opens AddNumberDialog
- [ ] **7.1.6** Plan limit indicator — "2 of 5 numbers used"
- [ ] **7.1.7** Empty state — "You don't have any numbers yet. Get your first number to start calling and messaging."

**Refs:** API GET /numbers, API DELETE /numbers/:id, US-010–US-015

### 7.2 — Add Number Dialog

- [ ] **7.2.1** Create `src/app/(dashboard)/numbers/add/page.tsx` — or dialog component
- [ ] **7.2.2** Country selector dropdown — USA, Canada, UK, Australia, Ireland, New Zealand, South Africa (FR-NUM-02)
- [ ] **7.2.3** Area code input (optional) → `GET /numbers/search?countryCode=US&areaCode=415&capabilities=voice,sms`
- [ ] **7.2.4** Capabilities filter checkboxes — Voice, SMS, MMS
- [ ] **7.2.5** Search results list — each result: number, locality, region, capabilities, monthly cost, "Get this number" button
- [ ] **7.2.6** Click "Get this number" → `POST /numbers { number }` → success toast → add to list → close dialog (complete within 10 seconds per FR-NUM-03)
- [ ] **7.2.7** Loading state while provisioning
- [ ] **7.2.8** No results state — "No numbers available for this criteria. Try a different area code."
- [ ] **7.2.9** Pre-select recommended number (URD Drop-off mitigation)

**Refs:** API GET /numbers/search, API POST /numbers, URD UC-04, US-010–US-013

---

## Phase 8 — Power Dialer Pages

### 8.1 — Campaign List Page

- [ ] **8.1.1** Create `src/app/(dashboard)/dialer/page.tsx` — CSR (SDD §2.4)
- [ ] **8.1.2** Fetch campaigns via `useQuery(['campaigns'], () => api.get('/campaigns'))`
- [ ] **8.1.3** Campaign cards — name, status badge (draft/running/paused/completed/stopped), progress bar (dialed/total), key metrics (answered, failed, remaining), startedAt
- [ ] **8.1.4** Campaign actions per status:
  - Draft → "Start", "Edit", "Delete"
  - Running → "Pause", "Stop", "View Live"
  - Paused → "Resume", "Stop", "View"
  - Completed → "Export CSV", "View Results"
  - Stopped → "Export CSV", "View Results"
- [ ] **8.1.5** "New Campaign" button → navigates to campaign creation flow
- [ ] **8.1.6** Empty state — "No campaigns yet. Create your first calling campaign to reach leads at scale."

**Refs:** API GET /campaigns, US-043, US-044

### 8.2 — Campaign Creation Flow

- [ ] **8.2.1** Create `src/app/(dashboard)/dialer/new/page.tsx` — multi-step form or single-page wizard
- [ ] **8.2.2** Step 1 — Campaign Name: text input
- [ ] **8.2.3** Step 2 — Upload CSV: create `src/components/dialer/CsvUploader.tsx` — drag-and-drop zone, accepts `.csv` only (max 50MB), file name + row count display after selection
- [ ] **8.2.4** Parse CSV client-side with PapaParse — extract headers, identify "phone" column (case-insensitive), show preview table (first 5 rows)
- [ ] **8.2.5** Validation report after file selection — total rows, valid numbers (green), invalid numbers (red with row + reason), DNC matches (orange, auto-skipped), download invalid rows as CSV (AC for US-040)
- [ ] **8.2.6** Step 3 — Configure Settings:
  - From number dropdown (user's numbers with voice capability)
  - Concurrency slider (1–10)
  - Delay between calls (0–60 seconds)
  - Retry attempts (0–3)
  - Calling hours start/end + timezone picker
  - Voicemail drop — upload or select pre-recorded .mp3
  - Schedule — "Start now" or pick date/time (ISO 8601)
- [ ] **8.2.7** Step 4 — Review & Start: summary of all settings, contact count, "Start Campaign" button
- [ ] **8.2.8** Submit — `POST /campaigns` (multipart/form-data) → success → navigate to campaign live view
- [ ] **8.2.9** Error handling — invalid CSV format, missing phone column, backend validation errors

**Refs:** API POST /campaigns, URD UC-02, AC for US-040, FR-PD-01–FR-PD-05, US-040–US-048

### 8.3 — Campaign Live View

- [ ] **8.3.1** Create `src/app/(dashboard)/dialer/[id]/page.tsx` — CSR
- [ ] **8.3.2** Fetch campaign data via `GET /campaigns/:id`
- [ ] **8.3.3** Create `src/components/dialer/CampaignDashboard.tsx` — live dashboard
- [ ] **8.3.4** Real-time stats via WebSocket `campaign:progress` events — update counters without polling
- [ ] **8.3.5** Stats cards: Total, Dialed, Answered, Failed, Busy, No Answer, Remaining
- [ ] **8.3.6** Progress bar — dialed / total with percentage
- [ ] **8.3.7** Call rate — calls per minute, estimated time remaining
- [ ] **8.3.8** Live contact table — scrolling list of recent contacts being dialed, updating statuses in real-time
- [ ] **8.3.9** Campaign controls — Pause / Resume / Stop buttons (per campaign status)
- [ ] **8.3.10** Join campaign WebSocket room on mount: `wsClient.joinCampaignRoom(campaignId)`; leave on unmount
- [ ] **8.3.11** When campaign completes → `campaign:complete` event → show completion summary, enable Export button

**Refs:** SDD §6.1, API §WebSocket Events, URD UC-02 Steps 7-9, US-043, US-044

### 8.4 — Campaign Export

- [ ] **8.4.1** Export button on completed/stopped campaigns → `GET /campaigns/:id/export` → download CSV file
- [ ] **8.4.2** CSV includes: phone, name, notes, status, attempts, call_duration, last_attempted_at

**Refs:** API GET /campaigns/:id/export, US-047, FR-PD-09

---

## Phase 9 — Contacts Pages

### 9.1 — Contacts List Page

- [ ] **9.1.1** Create `src/app/(dashboard)/contacts/page.tsx` — CSR
- [ ] **9.1.2** Fetch contacts via `useQuery(['contacts'], () => api.get('/contacts?page=1&limit=50'))` with search/filter params
- [ ] **9.1.3** Contact cards/table — name, primary phone, email, tags (colored badges), actions (edit, delete)
- [ ] **9.1.4** Search bar — debounced input → refetch with `?search=` param (FR-CON-04)
- [ ] **9.1.5** Filter by tag → click tag to filter
- [ ] **9.1.6** Pagination or infinite scroll
- [ ] **9.1.7** "Add Contact" button → opens AddContactDialog
- [ ] **9.1.8** "Import CSV" button → opens import dialog
- [ ] **9.1.9** Empty state — "No contacts yet. Add contacts to see caller names instead of numbers."

**Refs:** API GET /contacts, API POST /contacts, US-050–US-052, FR-CON-01–FR-CON-06

### 9.2 — Add/Edit Contact Dialog

- [ ] **9.2.1** Create contact form — name (required), email (optional), notes (textarea), tags (multi-select or text input with chips)
- [ ] **9.2.2** Phone number list — add multiple (number + label dropdown: mobile/work/home), remove button per phone
- [ ] **9.2.3** Create → `POST /contacts`
- [ ] **9.2.4** Edit → `PUT /contacts/:id`
- [ ] **9.2.5** Delete → confirmation dialog → `DELETE /contacts/:id`

**Refs:** API POST /contacts, API PUT /contacts/:id, API DELETE /contacts/:id

### 9.3 — Contact CSV Import

- [ ] **9.3.1** CSV upload dialog — drag-and-drop, parse with PapaParse, show preview, map CSV columns to contact fields (name, phone, email, notes, tags)
- [ ] **9.3.2** Submit → `POST /contacts/import` (multipart/form-data) → success count toast

**Refs:** API POST /contacts/import, US-051, FR-CON-03

---

## Phase 10 — Billing Pages

### 10.1 — Billing & Usage Page

- [ ] **10.1.1** Create `src/app/(dashboard)/billing/page.tsx` — CSR
- [ ] **10.1.2** Fetch usage via `useQuery(['usage'], () => api.get('/billing/usage'))`
- [ ] **10.1.3** Current plan card — plan name, monthly price, features list
- [ ] **10.1.4** Usage dashboard — circular progress or bar for each metric:
  - Minutes: `minutesUsed / minutesIncluded`
  - SMS: `smsUsed / smsIncluded`
  - Numbers: `numbersHeld / numbersAllowed`
- [ ] **10.1.5** Color-coded thresholds — green (<50%), yellow (50-80%), red (>80%)
- [ ] **10.1.6** "Upgrade Plan" button → plan comparison → Stripe Checkout redirect
- [ ] **10.1.7** "Downgrade Plan" — for Business → Pro, Pro → Free, show what you'll lose

**Refs:** API GET /billing/usage, US-060, US-061, FR-BILL-01, FR-BILL-05

### 10.2 — Invoices Page

- [ ] **10.2.1** Fetch invoices via `useQuery(['invoices'], () => api.get('/billing/invoices'))`
- [ ] **10.2.2** Invoice table — date/period, amount, status (paid/open/draft), download PDF button
- [ ] **10.2.3** Empty state — "No invoices yet."

**Refs:** API GET /billing/invoices, US-062, FR-BILL-06

---

## Phase 11 — Message Templates Page

### 11.1 — Templates Management

- [ ] **11.1.1** Create `src/app/(dashboard)/templates/page.tsx` — accessible from messages or settings
- [ ] **11.1.2** Template list — name, body preview, variable count
- [ ] **11.1.3** Create template — name, body (with `{variable}` placeholders), auto-detect variables
- [ ] **11.1.4** Edit / Delete templates
- [ ] **11.1.5** "Use Template" from message compose — select template, fill variables, send

**Refs:** FR-MSG-11, US-024

---

## Phase 12 — Settings Page

### 12.1 — Profile Settings

- [ ] **12.1.1** Create `src/app/(dashboard)/settings/page.tsx`
- [ ] **12.1.2** Profile section — avatar upload, first name, last name, email (read-only if verified), phone
- [ ] **12.1.3** Update password — current password + new password + confirm
- [ ] **12.1.4** Security section — 2FA status (enabled/disabled), enable/disable button → 2FA setup flow (Phase 3.5)
- [ ] **12.1.5** Session management — list active sessions (from refresh_tokens), "Revoke all sessions" button
- [ ] **12.1.6** API Keys section — list, create (copy-once), revoke (Phase 11 in backend)

### 12.2 — Danger Zone

- [ ] **12.2.1** Delete account — confirmation with email re-entry, GDPR data deletion notice

---

## Phase 13 — Hooks (Reusable Logic)

### 13.1 — Custom Hooks

- [ ] **13.1.1** `src/hooks/useWebSocket.ts` — connect on mount (if authenticated), event listeners, reconnect, disconnect on logout — returns: `{ isConnected, joinRoom, leaveRoom }`
- [ ] **13.1.2** `src/hooks/useInboundCall.ts` — subscribe to `call:inbound`, manage overlay state, handle accept/decline/timeout — returns: `{ incomingCall, acceptCall, declineCall }`
- [ ] **13.1.3** `src/hooks/useCampaignProgress.ts` — subscribe to `campaign:progress` for a specific campaignId, returns: `{ progress, isRunning }`
- [ ] **13.1.4** `src/hooks/useAuth.ts` — wraps authStore + TanStack Query for user profile, returns: `{ user, isAuthenticated, login, logout, register }`
- [ ] **13.1.5** `src/hooks/useActiveCall.ts` — wraps callStore + WebRTC client, returns: `{ activeCall, makeCall, hangUp, toggleMute, toggleHold, sendDigits }`
- [ ] **13.1.6** `src/hooks/useE164Validation.ts` — validate phone number with `libphonenumber-js`, returns: `{ isValid, formattedNumber, countryCode }`

**Refs:** SDD §2.1 (hooks/), SDD §2.2

---

## Phase 14 — Shared UI Components

### 14.1 — shadcn/ui Foundation

- [ ] **14.1.1** Init shadcn/ui — configure `components.json`
- [ ] **14.1.2** Add all required components: `Button`, `Input`, `Card`, `Dialog`, `Sheet`, `DropdownMenu`, `Tabs`, `Toast/Toaster`, `Skeleton`, `Badge`, `Avatar`, `Separator`, `Tooltip`, `Popover`, `Command`, `Select`, `Switch`, `Slider`, `Progress`, `Label`, `Textarea`, `Checkbox`

### 14.2 — Custom Components

- [ ] **14.2.1** `E164PhoneInput` — wraps `react-phone-number-input` with country flag selector, validates, formats to E.164
- [ ] **14.2.2** `StatusBadge` — maps status strings to colored badges (active=green, failed=red, pending=yellow, etc.)
- [ ] **14.2.3** `CapabilityBadge` — small indicator badges for voice/sms/mms capabilities
- [ ] **14.2.4** `ProviderBadge` — small badge with provider icon (Twilio/Vonage/etc.)
- [ ] **14.2.5** `EmptyState` — reusable: icon, title, description, optional action button
- [ ] **14.2.6** `LoadingSkeleton` — configurable skeleton card/table for loading states
- [ ] **14.2.7** `ConfirmDialog` — reusable confirmation modal with title, description, confirm/cancel
- [ ] **14.2.8** `DataTable` — generic paginated table with sort, search
- [ ] **14.2.9** `FileUploadZone` — drag-and-drop zone for CSV, with file type validation and size limit
- [ ] **14.2.10** `DurationDisplay` — format seconds into "MM:SS" or "Xh Ym Zs"

---

## Phase 15 — Responsive & Mobile

### 15.1 — Mobile Adaptations

- [ ] **15.1.1** Mobile sidebar — hidden by default, slide-out sheet on hamburger tap
- [ ] **15.1.2** Dial pad page — full-screen on mobile, larger touch targets for DTMF keys
- [ ] **15.1.3** Active call — optimized mobile layout, large mute/hangup buttons
- [ ] **15.1.4** Message thread — full-screen on mobile, back button to conversation list
- [ ] **15.1.5** Campaign dashboard — stacked stats cards, simplified table on mobile
- [ ] **15.1.6** Test all pages at 375px, 768px, 1024px, 1440px, 2560px widths (SRS §4.1)

**Refs:** SRS §4.1

---

## Phase 16 — Accessibility

### 16.1 — A11y Audit

- [ ] **16.1.1** Keyboard navigation — all interactive elements focusable + operable via keyboard
- [ ] **16.1.2** Screen reader — aria-labels on icon buttons, live regions for real-time updates (WebSocket events announced)
- [ ] **16.1.3** Color contrast — WCAG AA minimum (4.5:1 for text, 3:1 for large text)
- [ ] **16.1.4** Focus trapping — inside modals/dialogs
- [ ] **16.1.5** Skip-to-content link
- [ ] **16.1.6** Lighthouse accessibility score ≥ 90 (SRS §4.1)

**Refs:** SRS §4.1

---

## Phase 17 — Error & Edge States

### 17.1 — Global Error Handling

- [ ] **17.1.1** `error.tsx` at each route level — catch rendering errors, show friendly message + retry
- [ ] **17.1.2** `not-found.tsx` at each route level — 404 page
- [ ] **17.1.3** `loading.tsx` at each route level — skeleton loading state
- [ ] **17.1.4** Network offline detection — banner "You are offline. Reconnecting..."
- [ ] **17.1.5** API error toasts — extract error code + message from API response envelope, show toast
- [ ] **17.1.6** Form validation errors — inline field errors, scroll to first error
- [ ] **17.1.7** Session expiry handling — refresh token expired → redirect to login with "Session expired" message

**Refs:** API §Error Codes, SRS NFR-USE-03

---

## Phase 18 — Performance Optimization

### 18.1 — Optimization Tasks

- [ ] **18.1.1** Dynamic imports for heavy components: dial pad, WebRTC SDK, CSV parser (load only when needed)
- [ ] **18.1.2** Image optimization via `next/image` for avatars, media attachments
- [ ] **18.1.3** Virtualization — `react-virtual` or `@tanstack/react-virtual` for long conversation lists, message threads, campaign contact tables
- [ ] **18.1.4** Debounced inputs — search bars, area code input
- [ ] **18.1.5** TanStack Query stale time configuration — conversations: 30s, calls: 60s, numbers: 5min
- [ ] **18.1.6** Next.js bundle analyzer — identify and split large chunks

**Refs:** SRS §5.1 Performance, SRS NFR-PERF-01

---

## Phase 19 — Testing

### 19.1 — Component Tests

- [ ] **19.1.1** `LoginForm` — renders, validates, submits, shows errors
- [ ] **19.1.2** `RegisterForm` — password strength, email validation, success redirect
- [ ] **19.1.3** `DialPad` — number entry, DTMF tones, call button triggers
- [ ] **19.1.4** `MessageThread` — renders messages, scrolls to bottom, inbound/outbound styling
- [ ] **19.1.5** `MessageInput` — character count, typing, send
- [ ] **19.1.6** `InboundCallOverlay` — renders on incoming call, accept/decline/timeout
- [ ] **19.1.7** `CampaignDashboard` — stats display, progress bar, controls
- [ ] **19.1.8** `CsvUploader` — drag-drop, file validation, row count display
- [ ] **19.1.9** `ConversationList` — renders list, unread badges, search filter
- [ ] **19.1.10** `AddNumberDialog` — country select, search, provision flow

### 19.2 — Integration Tests

- [ ] **19.2.1** Registration → email verification → login → redirect to dashboard
- [ ] **19.2.2** Login → send SMS → message appears in thread → delivery status updates
- [ ] **19.2.3** Login → open dial pad → make call → active call bar appears → hang up
- [ ] **19.2.4** Receive inbound call → overlay appears → accept → active call bar → hang up
- [ ] **19.2.5** Campaign creation flow → CSV upload → validation report → start campaign → live dashboard
- [ ] **19.2.6** Number search → provision → appears in list → release

---

## Phase 20 — Production Readiness

- [ ] **20.1** Set production environment variables
- [ ] **20.2** `next build` — verify no build errors
- [ ] **20.3** Lighthouse audit — Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90
- [ ] **20.4** Bundle size check — no page > 200KB gzipped initial load
- [ ] **20.5** Meta tags + Open Graph — proper title, description, og:image for all pages
- [ ] **20.6** `robots.txt` and `sitemap.xml`
- [ ] **20.7** Dockerfile for production (standalone output)

---

## Task Summary

| Phase | What | # Tasks | Priority |
|-------|------|---------|----------|
| 0 — Foundation | Dependencies, Config, Layout | 14 | Blocker |
| 1 — Core Libraries | API client, WebSocket, WebRTC, Types | 17 | Blocker |
| 2 — State Stores | Auth, Call, Message Zustand stores | 13 | Blocker |
| 3 — Auth Pages | Register, Login, Verify Email, Password Reset, 2FA Setup, 2FA Verify | 25 | Critical |
| 4 — Dashboard Shell | Layout, Sidebar, Auth guard, WebSocket init | 9 | Critical |
| 5 — Messaging | Conversation list, Thread, New Message, Schedule, Templates | 21 | Critical |
| 6 — Calling | History, Dial Pad, Active Call, Inbound Overlay, Voicemail | 28 | Critical |
| 7 — Numbers | List, Add Number search/provision, Release | 13 | Critical |
| 8 — Power Dialer | Campaign list, Creation wizard, Live dashboard, Export | 22 | High |
| 9 — Contacts | List, Add/Edit, CSV Import | 10 | Medium |
| 10 — Billing | Usage dashboard, Plan upgrade, Invoices | 9 | High |
| 11 — Templates | CRUD, Variable detection, Use in compose | 5 | Low |
| 12 — Settings | Profile, Password, 2FA, Sessions, API Keys | 7 | Medium |
| 13 — Hooks | WebSocket, InboundCall, CampaignProgress, Auth, ActiveCall, E164 | 6 | Blocker |
| 14 — Shared UI | shadcn init, 10 custom components | 12 | Blocker |
| 15 — Mobile | Responsive adaptations | 6 | Medium |
| 16 — Accessibility | Keyboard, Screen reader, Contrast, Focus trap | 6 | Medium |
| 17 — Error States | Error boundaries, Not found, Loading, Offline | 7 | Medium |
| 18 — Performance | Dynamic imports, Virtualization, Debounce, Bundle analysis | 6 | Lower |
| 19 — Testing | 10 component + 6 integration tests | 16 | Per-phase |
| 20 — Production | Build, Lighthouse, Meta, Docker | 7 | Deploy |

**Total: ~259 tasks**

---

*Generated from SDD §2, URD Use Cases & Journey Maps & Acceptance Criteria, API Reference, PAL §9, SRS §4.1*
