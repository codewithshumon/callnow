// ============================================================
// VoiceLink — Shared TypeScript Types
// Derived from: API Reference, SDD §5.2 Schema, PAL §6 Status Maps
// ============================================================

// ── API Envelope ────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    field?: string;
  };
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: PaginatedMeta;
}

// ── Auth ────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: "user" | "business" | "admin";
  planId?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // 900 = 15 min
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

// ── Phone Numbers ───────────────────────────────────────────

export interface PhoneNumber {
  id: string;
  provider: string; // 'twilio' | 'vonage' | 'bandwidth' | 'plivo' | 'telnyx'
  providerSid: string;
  number: string; // E.164
  friendlyName?: string;
  countryCode: string;
  capabilities: NumberCapabilities;
  status: "active" | "releasing" | "released";
  monthlyCost: number;
  createdAt: string;
}

export interface NumberCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
}

export interface AvailableNumber {
  number: string; // E.164
  locality: string;
  region: string;
  capabilities: NumberCapabilities;
  monthlyCost: number;
}

// ── Messaging ───────────────────────────────────────────────

export interface Conversation {
  id: string;
  fromNumber: string;
  toNumber: string;
  contactName?: string;
  lastMessage?: {
    body: string;
    direction: "inbound" | "outbound";
    createdAt: string;
  };
  unreadCount: number;
}

export type MessageStatus = "queued" | "sent" | "delivered" | "failed";

export interface Message {
  id: string;
  conversationId?: string;
  provider: string;
  providerSid: string;
  direction: "inbound" | "outbound";
  body: string;
  mediaUrls: string[];
  status: MessageStatus;
  errorCode?: string;
  scheduledAt?: string;
  readAt?: string;
  createdAt: string;
}

// ── Calling ─────────────────────────────────────────────────

export type CallStatus =
  | "initiated"
  | "ringing"
  | "in-progress"
  | "completed"
  | "failed"
  | "busy"
  | "no-answer";

export interface Call {
  id: string;
  provider: string;
  providerSid: string;
  fromNumber: string;
  toNumber: string;
  direction: "inbound" | "outbound";
  status: CallStatus;
  durationSeconds: number;
  cost: string;
  recordingUrl?: string;
  startedAt: string;
  endedAt?: string;
}

export interface Voicemail {
  id: string;
  callId?: string;
  recordingUrl: string;
  transcript?: string;
  durationSeconds: number;
  isRead: boolean;
  createdAt: string;
}

export interface CallToken {
  token: string;
  expiresIn: number; // 3600 = 1 hour
  provider: string; // twilio | vonage | bandwidth | ...
}

// ── Contacts ─────────────────────────────────────────────────

export interface ContactPhone {
  id: string;
  number: string;
  label: "mobile" | "work" | "home" | "other";
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  notes?: string;
  tags: string[];
  phones: ContactPhone[];
  createdAt: string;
  updatedAt: string;
}

// ── Power Dialer ────────────────────────────────────────────

export type CampaignStatus =
  | "draft"
  | "running"
  | "paused"
  | "completed"
  | "stopped";

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  fromNumber: string;
  concurrency: number;
  delaySeconds: number;
  retryMax: number;
  totalContacts: number;
  dialed: number;
  answered: number;
  failed: number;
  remaining: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export type CampaignContactStatus =
  | "pending"
  | "dialing"
  | "answered"
  | "no-answer"
  | "busy"
  | "failed"
  | "dnc";

export interface CampaignContact {
  id: string;
  campaignId: string;
  phone: string;
  name?: string;
  notes?: string;
  status: CampaignContactStatus;
  attempts: number;
  callDuration?: number;
  lastAttemptedAt?: string;
}

export interface CsvValidationReport {
  total: number;
  valid: number;
  invalid: number;
  dncSkipped: number;
  invalidRows: Array<{ row: number; phone: string; reason: string }>;
}

// ── Billing ─────────────────────────────────────────────────

export interface Plan {
  id: string;
  name: string; // Free | Pro | Business
  maxNumbers: number;
  includedMinutes: number;
  includedSms: number;
  powerDialerEnabled: boolean;
  monthlyPrice: number;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: Plan;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd: string;
}

export interface UsageRecord {
  plan: string;
  period: { start: string; end: string };
  usage: {
    minutesUsed: number;
    minutesIncluded: number;
    smsUsed: number;
    smsIncluded: number;
    numbersHeld: number;
    numbersAllowed: number;
  };
}

export interface Invoice {
  id: string;
  amount: number;
  period: string;
  status: string;
  pdfUrl?: string;
}

// ── Message Templates ───────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

// ── API Keys ────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string; // first 8 chars
  scopes: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

// ── WebSocket Events ────────────────────────────────────────

export interface WsMessageNewEvent {
  event: "message:new";
  data: {
    conversationId: string;
    message: Message;
  };
}

export interface WsMessageStatusEvent {
  event: "message:status";
  data: {
    messageId: string;
    status: MessageStatus;
  };
}

export interface WsCallInboundEvent {
  event: "call:inbound";
  data: {
    callSid: string;
    from: string;
    to: string;
  };
}

export interface WsCallStatusEvent {
  event: "call:status";
  data: {
    callSid: string;
    status: CallStatus;
    duration?: number;
  };
}

export interface WsCampaignProgressEvent {
  event: "campaign:progress";
  data: {
    campaignId: string;
    dialed: number;
    answered: number;
    failed: number;
    remaining: number;
  };
}

export interface WsCampaignCompleteEvent {
  event: "campaign:complete";
  data: {
    campaignId: string;
    summary: {
      total: number;
      dialed: number;
      answered: number;
      failed: number;
      busy: number;
      noAnswer: number;
      duration: string;
    };
  };
}

export type WsEvent =
  | WsMessageNewEvent
  | WsMessageStatusEvent
  | WsCallInboundEvent
  | WsCallStatusEvent
  | WsCampaignProgressEvent
  | WsCampaignCompleteEvent;
