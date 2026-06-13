# VoiceLink Frontend — Design Guideline & Component Architecture

> **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · Zustand · TanStack Query
> **Derived from:** SDD §2, URD Personas & Use Cases & Journey Maps, API Reference, PAL §9
> **Key principle:** Page-specific components live in their page folder. Sharable components live in root `src/components/`.

---

## Folder Structure

```
view/
├── .env                              # NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WS_URL
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── package.json
│
├── public/
│   ├── logo.svg
│   ├── favicon.ico
│   └── sounds/
│       ├── inbound-ring.mp3
│       └── message-tone.mp3
│
└── src/
    ├── app/
    │   ├── globals.css
    │   ├── layout.tsx                    # Root layout: providers, fonts, metadata
    │   ├── page.tsx                      # Landing page (unauthenticated)
    │   ├── error.tsx                     # Global error boundary
    │   ├── not-found.tsx                 # 404
    │   │
    │   ├── (auth)/                       # Route group — unauthenticated pages
    │   │   ├── layout.tsx                # Auth layout: centered card, no sidebar
    │   │   ├── login/
    │   │   │   ├── page.tsx
    │   │   │   └── _components/          # Page-specific components
    │   │   │       ├── LoginForm.tsx
    │   │   │       ├── PhoneOtpForm.tsx
    │   │   │       └── GoogleLoginButton.tsx
    │   │   ├── register/
    │   │   │   ├── page.tsx
    │   │   │   └── _components/
    │   │   │       └── RegisterForm.tsx
    │   │   ├── verify-email/
    │   │   │   └── page.tsx
    │   │   ├── forgot-password/
    │   │   │   └── page.tsx
    │   │   ├── reset-password/
    │   │   │   └── page.tsx
    │   │   └── verify-2fa/
    │   │       └── page.tsx
    │   │
    │   └── (dashboard)/                  # Route group — authenticated pages
    │       ├── layout.tsx                # Dashboard layout: sidebar + main + WebSocket init
    │       ├── error.tsx
    │       ├── loading.tsx
    │       │
    │       ├── messages/
    │       │   ├── page.tsx              # Conversation list
    │       │   ├── loading.tsx
    │       │   ├── _components/
    │       │   │   ├── ConversationList.tsx
    │       │   │   ├── ConversationItem.tsx
    │       │   │   ├── ConversationSearch.tsx
    │       │   │   └── NewMessageDialog.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx           # Conversation thread
    │       │       └── _components/
    │       │           ├── MessageThread.tsx
    │       │           ├── MessageBubble.tsx
    │       │           ├── MessageInput.tsx
    │       │           ├── MessageStatus.tsx
    │       │           ├── ThreadHeader.tsx
    │       │           └── SchedulePicker.tsx
    │       │
    │       ├── calls/
    │       │   ├── page.tsx               # Call history
    │       │   ├── _components/
    │       │   │   ├── CallHistoryList.tsx
    │       │   │   ├── CallHistoryItem.tsx
    │       │   │   └── CallDetailSheet.tsx
    │       │   └── dialpad/
    │       │       ├── page.tsx
    │       │       └── _components/
    │       │           └── DialPad.tsx
    │       │
    │       ├── dialer/
    │       │   ├── page.tsx               # Campaign list
    │       │   ├── _components/
    │       │   │   ├── CampaignList.tsx
    │       │   │   └── CampaignCard.tsx
    │       │   ├── new/
    │       │   │   ├── page.tsx           # Campaign creation wizard
    │       │   │   └── _components/
    │       │   │       ├── CampaignNameStep.tsx
    │       │   │       ├── CsvUploadStep.tsx
    │       │   │       ├── CsvValidationReport.tsx
    │       │   │       ├── CampaignConfigStep.tsx
    │       │   │       └── CampaignReviewStep.tsx
    │       │   └── [id]/
    │       │       ├── page.tsx           # Campaign live view
    │       │       └── _components/
    │       │           ├── CampaignStats.tsx
    │       │           ├── CampaignProgress.tsx
    │       │           ├── LiveContactTable.tsx
    │       │           └── CampaignControls.tsx
    │       │
    │       ├── numbers/
    │       │   ├── page.tsx
    │       │   └── _components/
    │       │       ├── NumberCard.tsx
    │       │       └── AddNumberDialog.tsx
    │       │
    │       ├── contacts/
    │       │   ├── page.tsx
    │       │   └── _components/
    │       │       ├── ContactTable.tsx
    │       │       ├── ContactRow.tsx
    │       │       ├── ContactFormDialog.tsx
    │       │       └── ContactImportDialog.tsx
    │       │
    │       ├── billing/
    │       │   ├── page.tsx
    │       │   └── _components/
    │       │       ├── UsageDashboard.tsx
    │       │       ├── PlanCard.tsx
    │       │       └── InvoiceTable.tsx
    │       │
    │       ├── templates/
    │       │   ├── page.tsx
    │       │   └── _components/
    │       │       ├── TemplateList.tsx
    │       │       └── TemplateFormDialog.tsx
    │       │
    │       ├── voicemails/
    │       │   ├── page.tsx
    │       │   └── _components/
    │       │       ├── VoicemailList.tsx
    │       │       └── VoicemailPlayer.tsx
    │       │
    │       └── settings/
    │           ├── page.tsx
    │           └── _components/
    │               ├── ProfileSection.tsx
    │               ├── SecuritySection.tsx
    │               ├── TwoFactorSetup.tsx
    │               ├── ApiKeySection.tsx
    │               └── DangerZone.tsx
    │
    ├── components/                        # Shared / reusable across pages
    │   ├── layout/
    │   │   ├── Sidebar.tsx
    │   │   ├── SidebarNav.tsx
    │   │   ├── SidebarUser.tsx
    │   │   ├── TopBar.tsx               # Mobile header
    │   │   └── DashboardShell.tsx        # Wraps sidebar + main content
    │   │
    │   ├── calling/
    │   │   ├── ActiveCallBar.tsx         # Persistent bottom bar during call
    │   │   ├── InboundCallOverlay.tsx    # Full-screen incoming call
    │   │   ├── CallControls.tsx          # Mute/Hold/Hangup/Keypad buttons
    │   │   ├── CallTimer.tsx             # Live MM:SS display
    │   │   └── CallTransferDialog.tsx    # Transfer call to another number
    │   │
    │   ├── messaging/
    │   │   ├── CharCounter.tsx           # Character count with limit
    │   │   └── MediaPreview.tsx          # Image/audio preview in message
    │   │
    │   ├── ui/                           # shadcn/ui primitives (auto-generated)
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── card.tsx
    │   │   ├── dialog.tsx
    │   │   ├── sheet.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── tabs.tsx
    │   │   ├── toast.tsx
    │   │   ├── skeleton.tsx
    │   │   ├── badge.tsx
    │   │   ├── avatar.tsx
    │   │   ├── separator.tsx
    │   │   ├── tooltip.tsx
    │   │   ├── popover.tsx
    │   │   ├── command.tsx
    │   │   ├── select.tsx
    │   │   ├── switch.tsx
    │   │   ├── slider.tsx
    │   │   ├── progress.tsx
    │   │   ├── label.tsx
    │   │   ├── textarea.tsx
    │   │   └── checkbox.tsx
    │   │
    │   └── shared/                       # Custom reusable components
    │       ├── E164PhoneInput.tsx         # Phone input with country flag
    │       ├── StatusBadge.tsx            # Colored badge for status enums
    │       ├── CapabilityBadge.tsx         # Voice/SMS/MMS indicator
    │       ├── ProviderBadge.tsx           # Provider icon + name
    │       ├── EmptyState.tsx              # Icon + title + description + action
    │       ├── LoadingSkeleton.tsx         # Configurable skeleton loader
    │       ├── ConfirmDialog.tsx           # Reusable confirmation modal
    │       ├── DataTable.tsx              # Generic paginated table
    │       ├── FileUploadZone.tsx          # Drag-and-drop CSV/file uploader
    │       ├── DurationDisplay.tsx         # Format seconds → MM:SS
    │       ├── TimestampDisplay.tsx        # Relative/time-aware timestamp
    │       ├── PageHeader.tsx              # Title + description + actions
    │       ├── SearchInput.tsx             # Debounced search with icon
    │       ├── Pagination.tsx              # Page controls
    │       ├── AvatarUpload.tsx            # Image upload with crop
    │       └── CopyButton.tsx              # Click-to-copy with feedback
    │
    ├── lib/
    │   ├── api.ts                         # Axios instance + interceptors
    │   ├── websocket.ts                   # Socket.io client manager
    │   ├── webrtc.ts                      # Provider-agnostic WebRTC wrapper
    │   ├── types.ts                       # Shared TypeScript types + enums
    │   ├── utils.ts                       # cn(), formatPhone(), formatDuration(), etc.
    │   └── constants.ts                   # Plan limits, country list, status enums
    │
    ├── hooks/
    │   ├── useAuth.ts                     # Auth state + profile query
    │   ├── useWebSocket.ts                # Connect, rooms, event listeners
    │   ├── useInboundCall.ts              # Incoming call overlay logic
    │   ├── useActiveCall.ts               # Call state + WebRTC controls
    │   ├── useCampaignProgress.ts         # Campaign WebSocket subscription
    │   └── useE164.ts                     # Phone validation + formatting
    │
    └── store/
        ├── authStore.ts                   # Zustand: user, tokens
        ├── callStore.ts                   # Zustand: active call, incoming call
        └── messageStore.ts                # Zustand: conversations, messages cache
```

---

## Component Classification Rules

| Location | What goes here | Example |
|----------|---------------|---------|
| `src/components/shared/` | Used by 3+ pages, no domain coupling | `EmptyState`, `StatusBadge`, `E164PhoneInput` |
| `src/components/layout/` | Shell/skeleton of the app | `Sidebar`, `DashboardShell`, `TopBar` |
| `src/components/calling/` | Call UI that appears across pages | `ActiveCallBar`, `InboundCallOverlay` |
| `src/components/messaging/` | Messaging primitives used in multiple places | `CharCounter`, `MediaPreview` |
| `src/components/ui/` | shadcn/ui primitives (never edited directly) | `button.tsx`, `dialog.tsx` |
| `src/app/(dashboard)/<page>/_components/` | Used only on that specific page | `DialPad.tsx` (only on /calls/dialpad) |

**Decision rule:** If a component is imported by files in **two or more route folders**, it belongs in `src/components/`. If it's only used within one route, keep it in `_components/` next to its page.

---

## Page-by-Page Design Spec

### 1. Landing Page — `/`
**File:** `src/app/page.tsx`
**Auth:** None
**Rendering:** SSR

**Layout:**
```
┌──────────────────────────────────────────────┐
│  [VoiceLink Logo]            [Login] [Start] │
├──────────────────────────────────────────────┤
│                                              │
│     International Calling & Messaging        │
│     One platform. Any browser. No SIM.       │
│                                              │
│           [Get Started Free]                 │
│                                              │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│   │ Browser │  │ Virtual │  │ Power   │     │
│   │ Calls   │  │ Numbers │  │ Dialer  │     │
│   └─────────┘  └─────────┘  └─────────┘     │
│                                              │
│   "Sarah uses VoiceLink to take client       │
│    calls on her US number from London"       │
│                                              │
└──────────────────────────────────────────────┘
```

**Components used:**
- None page-specific (simple marketing page)
- `Button` (shared/ui) — for CTAs

**Data:** Static content. No API calls.

**Auth behavior:** If `authStore.isAuthenticated` → redirect to `/messages`.

---

### 2. Login Page — `/login`
**File:** `src/app/(auth)/login/page.tsx`
**Auth:** None
**Rendering:** SSR

**Layout:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│              [VoiceLink Logo]                    │
│                                                  │
│   ┌──────────────────────────────────────┐       │
│   │  Welcome back                        │       │
│   │                                      │       │
│   │  [ Email input                   ]   │       │
│   │  [ Password input                ]   │       │
│   │                                      │       │
│   │  [ Login ]                           │       │
│   │                                      │       │
│   │  ─── or ───                          │       │
│   │                                      │       │
│   │  [ Login with Google ]               │       │
│   │  [ Login with Phone ]                │       │
│   │                                      │       │
│   │  Forgot password?  ·  Create account │       │
│   └──────────────────────────────────────┘       │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | States |
|-----------|-------|--------|
| `LoginForm` | none | default, submitting, error (invalid credentials, rate limited) |
| `PhoneOtpForm` | none | phone-input (request OTP), otp-input (verify 6-digit code), countdown timer for resend |
| `GoogleLoginButton` | none | default, loading |

**Components used from shared:**
- `Button`, `Input`, `Label`, `Separator`, `Card` (ui/)
- `StatusBadge` — show rate limit warning

**API calls:**
- `POST /auth/login` → `{ accessToken, refreshToken, expiresIn }` or `{ loginToken }` (2FA)
- `POST /auth/login/phone` → request OTP / verify OTP
- `POST /auth/google` → exchange Google idToken

**Flow:**
1. Submit credentials → `POST /auth/login`
2. If `loginToken` returned → redirect to `/verify-2fa?token=...`
3. If tokens returned → store in authStore → redirect to `/messages`
4. Error → show inline message
5. Rate limited → show "Try again in X minutes" with countdown

---

### 3. Register Page — `/register`
**File:** `src/app/(auth)/register/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────┐
│              [VoiceLink Logo]                    │
│   ┌──────────────────────────────────────┐       │
│   │  Create your account                 │       │
│   │                                      │       │
│   │  [ Email input                   ]   │       │
│   │  [ Password input                ]   │       │
│   │  [ ████████░░░░ ]  8+ chars, 1    │       │
│   │    number, 1 special                 │       │
│   │  [ Confirm password              ]   │       │
│   │                                      │       │
│   │  [ Create Account ]                  │       │
│   │                                      │       │
│   │  ─── or ───                          │       │
│   │  [ Sign up with Google ]             │       │
│   │                                      │       │
│   │  Already have an account? Log in     │       │
│   └──────────────────────────────────────┘       │
└──────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | States |
|-----------|-------|--------|
| `RegisterForm` | none | default, validating, submitting, success (check email), error (email taken) |

**API calls:** `POST /auth/register`

**Success state:** Redirect to interstitial "Check your email to verify your account."

---

### 4. Email Verification — `/verify-email`
**File:** `src/app/(auth)/verify-email/page.tsx`

Reads `?token=` from URL. Auto-calls `POST /auth/verify-email` on mount.

**States:**
- `verifying` — spinner + "Verifying your email..."
- `success` — checkmark + "Email verified! Redirecting..." → auto-redirect to `/login` after 3s
- `error` — "Invalid or expired link." + "Resend verification email" button
- `resent` — "Verification email resent. Check your inbox."

---

### 5. Forgot Password — `/forgot-password`
**File:** `src/app/(auth)/forgot-password/page.tsx`

Simple email input form. Submits `POST /auth/forgot-password`. Always shows success message (don't reveal if email exists). "If an account exists for that email, we've sent a reset link."

---

### 6. Reset Password — `/reset-password`
**File:** `src/app/(auth)/reset-password/page.tsx`

Reads `?token=` from URL. New password + confirm. Submits `POST /auth/reset-password`. On success → redirect to login with "Password reset. Please log in."

---

### 7. 2FA Verify — `/verify-2fa`
**File:** `src/app/(auth)/verify-2fa/page.tsx`

Reads `?loginToken=` from URL. 6-digit OTP input (auto-focus, auto-submit on 6 digits). Submits `POST /auth/2fa/verify`. On success → store tokens → redirect to `/messages`. On error → shake animation + "Invalid code. Try again."

---

### 8. Dashboard Shell — Layout
**File:** `src/app/(dashboard)/layout.tsx`

**Responsibilities:**
1. Auth guard — if no valid token, redirect to `/login`
2. On mount: connect WebSocket, initialize WebRTC device
3. Global listeners: `call:inbound` (show overlay), `message:new` (update store + notification)
4. Render sidebar + main content area

**Shared layout components:**

| Component | Location | Purpose |
|-----------|----------|---------|
| `DashboardShell` | `src/components/layout/` | Flex container: sidebar (fixed, 240px) + main (flex-1, scrollable) |
| `Sidebar` | `src/components/layout/` | Full sidebar with nav, user menu, usage bar |
| `SidebarNav` | `src/components/layout/` | Nav links with active highlight, icons, badges |
| `SidebarUser` | `src/components/layout/` | User avatar, email, dropdown (Profile, Logout) |
| `TopBar` | `src/components/layout/` | Mobile-only: hamburger, page title, notification bell |

**Layout behavior:**
- Desktop (≥1024px): Sidebar visible always, 240px wide
- Tablet (768–1023px): Collapsed sidebar (icons only, 64px)
- Mobile (<768px): Sidebar hidden, hamburger opens sheet from left

---

### 9. Messages — Conversation List — `/messages`
**File:** `src/app/(dashboard)/messages/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Messages                         [New Message]      │
│  ┌────────────────────┐ ┌───────────────────────────┐│
│  │ 🔍 Search...      │ │                           ││
│  │────────────────────│ │     Select a conversation ││
│  │ ● Sarah Johnson    │ │     or start a new one    ││
│  │   "Thanks, got it" │ │                           ││
│  │   2m ago      [2]  │ │                           ││
│  │────────────────────│ │                           ││
│  │ ● Marcus Lee       │ │                           ││
│  │   "Campaign is..." │ │                           ││
│  │   1h ago            │ │                           ││
│  │────────────────────│ │                           ││
│  │ ● +44 7911 123456  │ │                           ││
│  │   "Hi, is this..." │ │                           ││
│  │   3h ago            │ │                           ││
│  └────────────────────┘ └───────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `ConversationList` | none (uses hook) | Scrollable list, fetches from `GET /conversations` |
| `ConversationItem` | `{ conversation, isActive, onClick }` | Single row: contact name/number, last message preview, timestamp, unread badge |
| `ConversationSearch` | `{ value, onChange }` | Debounced search — filters conversations client-side |
| `NewMessageDialog` | `{ open, onClose }` | Dialog: from-number dropdown, to-number phone input, body textarea, send button |

**States:** loading (skeleton list), empty ("No messages yet"), populated, search results empty ("No conversations match your search")

**Data:** `useQuery('conversations', ...)` with TanStack Query, 30s stale time, WebSocket pushes new messages update list order + unread counts.

**Mobile:** Full-screen list, tapping a conversation navigates to `[id]` page with back button to return.

---

### 10. Messages — Conversation Thread — `/messages/[id]`
**File:** `src/app/(dashboard)/messages/[id]/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  ← Sarah Johnson            [📞 Call] [⋯ More]      │
│──────────────────────────────────────────────────────│
│                                                      │
│                                  ┌──────────────────┐│
│                                  │  Thanks, got it! ││
│                                  │  Delivered ✓✓ 2m ││
│                                  └──────────────────┘│
│  ┌──────────────────┐                                │
│  │  Can you send    │                                │
│  │  the files over? │                                │
│  │  Sent ✓✓ 5m      │                                │
│  └──────────────────┘                                │
│                                                      │
│──────────────────────────────────────────────────────│
│  [😊] [📎] [Message text input...          ] [⏰] [➤]│
│  └ 320/1600 characters ────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `ThreadHeader` | `{ conversation, onCall, onBack }` | Contact name, call button, more menu |
| `MessageThread` | `{ messages, isLoading, onLoadMore }` | Scrollable message list, infinite scroll up |
| `MessageBubble` | `{ message, isOutbound }` | Single bubble: body, media (image thumbnail), status indicator, timestamp. Inbound = left+gray, Outbound = right+blue |
| `MessageStatus` | `{ status }` | Icon: clock (queued) → single check (sent) → double check (delivered) → ❌ (failed) |
| `MessageInput` | `{ onSend, onSchedule }` | Textarea + emoji button + attach button + schedule button + send button + character counter |
| `SchedulePicker` | `{ open, onClose, onSchedule }` | Date/time picker for scheduled messages |

**Shared components used:**
- `CharCounter` (`components/messaging/`) — character count with 1600 limit, segment preview
- `MediaPreview` (`components/messaging/`) — image/audio preview in message bubble

**States:** loading (skeleton bubbles), empty thread ("Send a message to start"), populated, sending (optimistic bubble with spinner), failed send (red indicator + retry button)

**Data flow:**
- Fetch: `useInfiniteQuery(['messages', id], ...)` with cursor-based pagination (50/page)
- Real-time: WebSocket `message:new` → prepend to thread if belongs to this conversation
- Send: optimistic insert with `sending` status → `POST /messages` → update with `providerSid` + `queued` status
- Status updates: WebSocket `message:status` → update bubble icon

---

### 11. Calls — Call History — `/calls`
**File:** `src/app/(dashboard)/calls/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Call History                      [Dial Pad]        │
│  [All] [Inbound] [Outbound] [Missed]                 │
│──────────────────────────────────────────────────────│
│  ↙ +1 (415) 555-1234    Sarah Johnson                │
│     Inbound · 3:07 · $0.0234 · 2 hours ago    [▶]   │
│──────────────────────────────────────────────────────│
│  ↗ +44 7911 123456      Unknown                      │
│     Outbound · 0:45 · $0.0102 · Yesterday      [▶]   │
│──────────────────────────────────────────────────────│
│  ↙ +1 (212) 555-9876    Marcus Lee                   │
│     Missed · 0:00 · 3 hours ago               [▶]   │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `CallHistoryList` | none (uses hook) | Fetches `GET /calls`, filter tabs |
| `CallHistoryItem` | `{ call, onClick }` | Direction icon, contact/number, status, duration, cost, time |
| `CallDetailSheet` | `{ call, open, onClose }` | Side sheet: full CDR details, recording playback, voicemail link |

**States:** loading (skeleton rows), empty ("No calls yet"), populated, filtered empty

**Data:** `useQuery(['calls', filter], () => api.get('/calls?direction=...'))`. Paginated (infinite scroll or load more).

---

### 12. Calls — Dial Pad — `/calls/dialpad`
**File:** `src/app/(dashboard)/calls/dialpad/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Dial Pad                                           │
│──────────────────────────────────────────────────────│
│                                                      │
│  From: [My US Number (+14155551234) ▼]              │
│                                                      │
│  ┌──────────────────────────────────┐               │
│  │  +1 (415) 555-9876              │               │
│  └──────────────────────────────────┘               │
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │    1    │ │    2    │ │    3    │                │
│  │         │ │  ABC    │ │  DEF    │                │
│  ├─────────┤ ├─────────┤ ├─────────┤                │
│  │    4    │ │    5    │ │    6    │                │
│  │  GHI    │ │  JKL    │ │  MNO    │                │
│  ├─────────┤ ├─────────┤ ├─────────┤                │
│  │    7    │ │    8    │ │    9    │                │
│  │  PQRS   │ │  TUV    │ │  WXYZ   │                │
│  ├─────────┤ ├─────────┤ ├─────────┤                │
│  │    *    │ │    0    │ │    #    │                │
│  └─────────┘ └─────────┘ └─────────┘                │
│                                                      │
│              ┌──────────────────┐                    │
│              │       📞         │                    │
│              │      Call        │                    │
│              └──────────────────┘                    │
│                                                      │
│  Recent: +44 7911 123456 · Sarah · +1 (212) 555...  │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `DialPad` | none | Full dial pad with DTMF keys, number display, call button |

**Shared components used:**
- `E164PhoneInput` — NOT used here; raw digit input since user types numbers
- `CallControls`, `CallTimer` — shown inside `ActiveCallBar` after call connects

**Interaction:**
1. User types number via keypad (or keyboard) → display updates with formatted E.164
2. User selects "From" number from dropdown
3. User clicks Call → `POST /calls/token` → `webrtc.makeCall(params)` → `ActiveCallBar` appears
4. After hangup → call ends, bar disappears, CDR stored

**States:** default (empty display), number entered (call button enabled), dialing (calling spinner), connected (show ActiveCallBar below)

---

### 13. Active Call Bar (Shared Component)
**File:** `src/components/calling/ActiveCallBar.tsx`
**Visible on:** All dashboard pages when a call is active

```
┌──────────────────────────────────────────────────────┐
│  📞 +1 (415) 555-1234 · Sarah Johnson   03:47       │
│  [🔇 Mute] [⏸ Hold] [⊞ Keypad] [⇄ Transfer] [⏺] [🔴]│
└──────────────────────────────────────────────────────┘
```

| Component | Props | Purpose |
|-----------|-------|---------|
| `ActiveCallBar` | none (reads callStore) | Fixed bottom bar, visible during active call |
| `CallControls` | `{ isMuted, isOnHold, onToggleMute, onToggleHold, onOpenKeypad, onTransfer, onHangup }` | Button row for all call actions |
| `CallTimer` | `{ startTime }` | Live MM:SS display, updates every second |
| `CallTransferDialog` | `{ open, onClose, onTransfer }` | Dialog: select contact or enter number to transfer call to |

**Interaction with page content:**
- On any dashboard page: bar is fixed at bottom, content area gets `pb-16` padding
- Clicking the bar → expands to full call view (larger controls, more info)
- After hangup: bar slides down with animation, content padding resets

---

### 14. Inbound Call Overlay (Shared Component)
**File:** `src/components/calling/InboundCallOverlay.tsx`
**Visible on:** Any page (even background tab) when incoming call arrives

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│                                                      │
│                    📞 Incoming Call                  │
│                                                      │
│                 Sarah Johnson                        │
│                 +1 (415) 555-1234                    │
│                                                      │
│                                                      │
│              ┌──────────┐  ┌──────────┐              │
│              │  Decline │  │  Accept  │              │
│              │    🔴    │  │    🟢    │              │
│              └──────────┘  └──────────┘              │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Behavior:**
- Full-screen overlay with dark backdrop
- Tab title changes to "📞 Incoming call..."
- Browser notification sent (if permission granted)
- 30-second auto-timeout → call goes to voicemail
- Accept → connect WebRTC, close overlay, show ActiveCallBar
- Decline → caller goes to voicemail, overlay closes, missed call CDR
- If already on a call → "Call Waiting" variant with Accept/Decline for second call

The overlay is rendered at the dashboard layout level (not inside any specific page) so it appears regardless of which page the user is on.

---

### 15. Numbers — `/numbers`
**File:** `src/app/(dashboard)/numbers/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  My Numbers                         [+ Add Number]   │
│──────────────────────────────────────────────────────│
│  2 of 5 numbers used                                │
│                                                     │
│  ┌──────────────────────────────────────┐           │
│  │ 🇺🇸 +1 (415) 555-1234                │           │
│  │ My US Number                         │           │
│  │ Twilio · $1.15/month                 │           │
│  │ [Voice ✓] [SMS ✓] [MMS ✓]           │           │
│  │                       [Release...]   │           │
│  └──────────────────────────────────────┘           │
│                                                     │
│  ┌──────────────────────────────────────┐           │
│  │ 🇨🇦 +1 (416) 555-9876                │           │
│  │ Toronto Business Line                │           │
│  │ Twilio · $2.00/month                 │           │
│  │ [Voice ✓] [SMS ✓] [MMS ✗]           │           │
│  │                       [Release...]   │           │
│  └──────────────────────────────────────┘           │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `NumberCard` | `{ number, onRelease }` | Card per number: country flag, E.164, friendly name, provider badge, capabilities, monthly cost, release button |
| `AddNumberDialog` | `{ open, onClose, onAdded }` | Multi-step: country select → area code (optional) → capabilities filter → search results list → provision button |

**Shared components used:**
- `StatusBadge` — active/releasing/released
- `CapabilityBadge` — Voice ✓ / SMS ✓ / MMS ✗
- `ProviderBadge` — Twilio (or other provider icon)
- `EmptyState` — "No numbers yet"
- `ConfirmDialog` — "Release this number? You will no longer receive calls or messages to this number."

**Data:** `GET /numbers` → list. `GET /numbers/search?...` → available numbers. `POST /numbers` → provision.

---

### 16. Power Dialer — Campaign List — `/dialer`
**File:** `src/app/(dashboard)/dialer/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Campaigns                         [+ New Campaign]  │
│──────────────────────────────────────────────────────│
│  ┌──────────────────────────────────────────────┐    │
│  │ January Leads              ● Running          │    │
│  │ ████████████░░░░░░░░ 234/842 dialed          │    │
│  │ ✓ 89 answered · ✗ 12 failed · ⏳ 608 remain  │    │
│  │ Started Jan 15, 2024 9:00 AM                  │    │
│  │                     [Pause] [Stop] [View Live]│    │
│  └──────────────────────────────────────────────┘    │
│                                                     │
│  ┌──────────────────────────────────────────────┐    │
│  │ December Follow-ups        ● Completed        │    │
│  │ ████████████████████████ 500/500 dialed      │    │
│  │ ✓ 312 answered · ✗ 45 failed                 │    │
│  │ Completed Jan 10, 2024 4:30 PM               │    │
│  │                          [View] [Export CSV]  │    │
│  └──────────────────────────────────────────────┘    │
│                                                     │
│  ┌──────────────────────────────────────────────┐    │
│  │ Lead List Q4              ⏸ Paused            │    │
│  │ ██████░░░░░░░░░░░░░░ 156/300 dialed          │    │
│  │ ✓ 98 answered · ✗ 8 failed · ⏳ 144 remain   │    │
│  │ Paused Jan 12, 2024 1:00 PM                  │    │
│  │                          [Resume] [Stop]      │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `CampaignList` | none (uses hook) | Fetches `GET /campaigns`, renders campaign cards |
| `CampaignCard` | `{ campaign, onAction }` | Stats bar, status badge, action buttons per status |

**Shared components used:**
- `StatusBadge` — running=green, paused=yellow, completed=blue, stopped=gray
- `EmptyState` — "No campaigns yet"
- `ConfirmDialog` — "Stop this campaign? This cannot be undone."

---

### 17. Power Dialer — New Campaign — `/dialer/new`
**File:** `src/app/(dashboard)/dialer/new/page.tsx`

**Layout (Step 2 — CSV Upload shown):**
```
┌──────────────────────────────────────────────────────┐
│  New Campaign                                       │
│──────────────────────────────────────────────────────│
│  Step 1 ○ → Step 2 ● → Step 3 ○ → Step 4 ○        │
│──────────────────────────────────────────────────────│
│                                                      │
│  Upload Contact List                                 │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │           📁                                 │      │
│  │  Drag & drop a CSV file or click to browse  │      │
│  │  Accepted: .csv only · Max 50MB            │      │
│  │  Required column: phone                     │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  File uploaded: leads_january.csv (842 rows)         │
│                                                      │
│  Validation Report:                                  │
│  ┌────────────────────────────────────────────┐      │
│  │ ✓ 825 valid numbers ready to dial          │      │
│  │ ⚠ 17 numbers skipped                      │      │
│  │   · Row 23: +1234 — invalid E.164 format   │      │
│  │   · Row 89: +1555123456 — missing +        │      │
│  │   · Row 142: +1 (800) 555-0199 — DNC match │      │
│  │   · ... (17 total)                          │      │
│  │                                             │      │
│  │ [Download invalid rows as CSV]              │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│  ┌────────────────────────────────────────────┐      │
│  │ Column mapping:                             │      │
│  │ Phone → phone ✓ (detected)                  │      │
│  │ Name  → name ✓ (detected)                   │      │
│  │ Notes → notes ✓ (detected)                  │      │
│  └────────────────────────────────────────────┘      │
│                                                      │
│                         [← Back]  [Continue →]       │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `CampaignNameStep` | `{ value, onChange }` | Simple text input for campaign name |
| `CsvUploadStep` | `{ onFileParsed, onValidationComplete }` | Drag-drop zone → PapaParse → column detection → validation |
| `CsvValidationReport` | `{ report }` | Stats (valid/invalid/DNC), invalid rows table with reasons |
| `CampaignConfigStep` | `{ config, onChange }` | From-number, concurrency (slider 1-10), delay (slider 0-60), retry (0-3), calling hours (start/end time + timezone picker), voicemail drop upload, schedule toggle |
| `CampaignReviewStep` | `{ name, config, validation }` | Summary of all settings before submit |

**Shared components used:**
- `FileUploadZone` — drag-and-drop area with file type validation, size limit, preview
- `DataTable` — invalid rows table
- `Slider` (ui) — concurrency and delay config
- `Select` (ui) — from-number dropdown, timezone picker

**Step flow:**
1. Name → 2. CSV Upload + Validation → 3. Settings → 4. Review → Submit `POST /campaigns` (multipart/form-data)

---

### 18. Power Dialer — Campaign Live — `/dialer/[id]`
**File:** `src/app/(dashboard)/dialer/[id]/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  ← January Leads                    ● Running         │
│  [Pause] [Stop]                                      │
│──────────────────────────────────────────────────────│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│  │  Total  │ │ Dialed  │ │Answered │ │ Failed  │    │
│  │   842   │ │   234   │ │   89    │ │   12    │    │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │
│  ┌─────────┐ ┌─────────┐                             │
│  │  Busy   │ │Remaining│    ████████████░░░░ 28%     │
│  │    14   │ │   608   │    2.3 calls/min            │
│  └─────────┘ └─────────┘    Est. remaining: 4h 12m   │
│──────────────────────────────────────────────────────│
│  Live Activity                                       │
│  ┌──────────────────────────────────────────────┐    │
│  │ +1 (415) 555-0101  John Smith     → Answered │    │
│  │ +1 (415) 555-0102  Jane Doe       → No Ans.  │    │
│  │ +1 (415) 555-0103  Bob Wilson     → Dialing  │    │
│  │ +1 (415) 555-0104  Unknown        → Waiting  │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `CampaignStats` | `{ campaign }` | Stat cards row: total, dialed, answered, failed, busy, remaining |
| `CampaignProgress` | `{ dialed, total, callsPerMin, eta }` | Progress bar + rate + estimated time remaining |
| `LiveContactTable` | `{ contacts }` | Scrolling table of recent contacts being dialed, updating in real-time via WebSocket |
| `CampaignControls` | `{ status, onPause, onResume, onStop }` | Pause/Resume/Stop buttons, enabled/disabled per status |

**Shared components used:**
- `Progress` (ui) — progress bar
- `StatusBadge` — per contact status

**Real-time:** Joins WebSocket room `campaign:{id}` on mount. Updates stats and contact table via `campaign:progress` events (every 5 dials). On `campaign:complete` → show completion summary, enable export.

---

### 19. Contacts — `/contacts`
**File:** `src/app/(dashboard)/contacts/page.tsx`

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Contacts                  [Import] [+ Add Contact]  │
│  🔍 Search...    [All Tags ▼]                        │
│──────────────────────────────────────────────────────│
│  Name            │ Phone            │ Tags     │     │
│──────────────────│──────────────────│──────────│     │
│  Sarah Johnson   │ +1 (415) 555-1234│ vip      │ ⋯  │
│                  │ +1 (415) 555-5678│ london   │     │
│──────────────────│──────────────────│──────────│     │
│  Marcus Lee      │ +1 (212) 555-9876│ sales    │ ⋯  │
│──────────────────│──────────────────│──────────│     │
│  Priya Patel     │ +1 (416) 555-3456│ support  │ ⋯  │
│──────────────────│──────────────────│──────────│     │
└──────────────────────────────────────────────────────┘
```

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `ContactTable` | none (uses hook) | Fetches `GET /contacts`, search + tag filter |
| `ContactRow` | `{ contact, onEdit, onDelete }` | Row: name, all phones (stacked), tags (badges), actions |
| `ContactFormDialog` | `{ open, onClose, contact? }` | Create/edit form: name, multiple phone inputs (number + label), email, notes, tags |
| `ContactImportDialog` | `{ open, onClose }` | CSV upload → column mapping → import |

**Shared components used:**
- `DataTable` — generic table
- `EmptyState` — "No contacts yet"
- `ConfirmDialog` — delete confirmation
- `FileUploadZone` — CSV import

---

### 20. Billing — `/billing`
**File:** `src/app/(dashboard)/billing/page.tsx`

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `PlanCard` | `{ plan, usage, onUpgrade, onDowngrade }` | Current plan name, price, feature list, upgrade/downgrade button |
| `UsageDashboard` | `{ usage }` | Circular/bar progress for minutes, SMS, numbers with color thresholds |
| `InvoiceTable` | `{ invoices }` | Date, amount, status, PDF download |

**Shared components used:** `Progress` (ui), `StatusBadge`, `EmptyState`

**API calls:** `GET /billing/usage`, `GET /billing/invoices`, `POST /billing/upgrade` → Stripe Checkout redirect.

---

### 21. Voicemails — `/voicemails`
**File:** `src/app/(dashboard)/voicemails/page.tsx`

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `VoicemailList` | none (uses hook) | Fetches `GET /voicemails`, renders list with unread badges |
| `VoicemailPlayer` | `{ voicemail }` | Audio player for recording, transcript display below, mark-as-read on play |

**Shared components used:** `EmptyState` — "No voicemails."

---

### 22. Templates — `/templates`
**File:** `src/app/(dashboard)/templates/page.tsx`

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `TemplateList` | none (uses hook) | List of templates: name, body preview, variable count |
| `TemplateFormDialog` | `{ open, onClose, template? }` | Create/edit: name, body with `{variable}` highlighting |

---

### 23. Settings — `/settings`
**File:** `src/app/(dashboard)/settings/page.tsx`

**Page-specific components (`_components/`):**

| Component | Props | Purpose |
|-----------|-------|---------|
| `ProfileSection` | `{ user }` | Avatar, name, email (read-only), phone — editable |
| `SecuritySection` | `{ user }` | Change password form, 2FA toggle |
| `TwoFactorSetup` | `{ onEnabled }` | QR code display, TOTP verify, backup codes |
| `ApiKeySection` | none | List API keys (prefix + created + last used), create new (show once + copy), revoke |
| `DangerZone` | none | Delete account button → email confirmation → submit |

**Shared components used:** `AvatarUpload`, `CopyButton`, `ConfirmDialog`, `StatusBadge`

---

## Shared Component Design Specs

### `E164PhoneInput`
**File:** `src/components/shared/E164PhoneInput.tsx`
**Used by:** NewMessageDialog, AddNumberDialog, caller ID settings, login phone input, contact forms
**Props:** `{ value: string, onChange: (e164: string) => void, placeholder?: string, disabled?: boolean, error?: string }`
**States:** default, focused, filled, error, disabled
**Behavior:** Wraps `react-phone-number-input`. Country flag dropdown on left. Auto-formats as user types. Validates to E.164 on change. Shows error message below when invalid.

### `StatusBadge`
**File:** `src/components/shared/StatusBadge.tsx`
**Used by:** Every list page
**Props:** `{ status: string, variant?: 'solid' | 'outline', size?: 'sm' | 'md' }`
**Color map:**
- `active` / `running` / `completed` / `delivered` / `paid` → green
- `paused` / `pending` / `queued` / `sent` / `open` → yellow
- `failed` / `stopped` / `busy` / `past_due` → red
- `no-answer` / `draft` / `canceled` / `released` → gray
- `ringing` / `in-progress` / `initiated` → blue

### `EmptyState`
**File:** `src/components/shared/EmptyState.tsx`
**Used by:** Every list page
**Props:** `{ icon: LucideIcon, title: string, description: string, action?: { label: string, onClick: () => void } }`
**Layout:** Centered vertical stack: large muted icon → title → description → optional action button.

### `FileUploadZone`
**File:** `src/components/shared/FileUploadZone.tsx`
**Used by:** CsvUploadStep (dialer), ContactImportDialog
**Props:** `{ accept: string, maxSizeMB: number, onFile: (file: File) => void, error?: string }`
**States:** default (drag prompt), drag-over (highlighted border), file-selected (filename + size), error (wrong type / too large), parsing (spinner)

### `ConfirmDialog`
**File:** `src/components/shared/ConfirmDialog.tsx`
**Used by:** Every destructive action
**Props:** `{ open: boolean, onClose: () => void, onConfirm: () => void, title: string, description: string, confirmLabel?: string, variant?: 'default' | 'destructive' }`

### `PageHeader`
**File:** `src/components/shared/PageHeader.tsx`
**Used by:** Every page
**Props:** `{ title: string, description?: string, actions?: ReactNode }`

---

## Design Tokens

### Colors
```
Primary:     blue-600 (#2563EB)  — buttons, links, active states
Destructive: red-600 (#DC2626)   — delete, release, hangup
Success:     green-600 (#16A34A) — answered, delivered, paid
Warning:     yellow-500 (#EAB308)— queued, paused, pending
Neutral:     zinc-50 → zinc-900  — backgrounds, text, borders
```

### Spacing
```
Page padding: px-6 py-4 (desktop), px-4 py-3 (mobile)
Card padding: p-4
Section gap: gap-6 (desktop), gap-4 (mobile)
```

### Typography
```
Page title: text-2xl font-semibold
Section title: text-lg font-medium
Body: text-sm text-zinc-700 dark:text-zinc-300
Caption: text-xs text-zinc-500
```

### Breakpoints
```
Mobile:  <768px  — full-screen pages, sheet sidebar
Tablet:  768-1023px — collapsed icon sidebar
Desktop: ≥1024px — full sidebar
Wide:    ≥1440px — max-w for content areas
```

---

## State Naming Convention

Every component that fetches or mutates data must handle these states:

| State | UI | Example |
|-------|----|---------|
| `loading` / `pending` | Skeleton or spinner | Conversation list loading |
| `empty` | EmptyState component | "No conversations yet" |
| `error` | Inline error + retry button | "Failed to load. [Retry]" |
| `success` / `idle` | Normal content | List of conversations |
| `submitting` / `mutating` | Button loading spinner, inputs disabled | Sending a message |
| `optimistic` | Show data immediately with muted style + spinner icon | Message appears in thread before server confirms |

---

*Generated from SDD §2, URD Use Cases & Journey Maps, API Reference, PAL §9*
