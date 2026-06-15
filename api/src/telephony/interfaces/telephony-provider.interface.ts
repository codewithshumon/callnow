// VoiceLink — Telephony Provider Abstraction Layer
// Ref: PAL §3, PAL §3.1
// =============================================================================

// ---------------------------------------------------------------------------
// Provider Capabilities (PAL §10)
// ---------------------------------------------------------------------------
export interface ProviderCapabilities {
  voice: boolean;
  sms: boolean;
  mms: boolean;
  voicemailTranscription: boolean;
  callRecording: boolean;
  conferenceCalling: boolean;
  numberPorting: boolean;
  tollFreeNumbers: boolean;
  supportedCountries: string[]; // ISO 3166-1 alpha-2 country codes
}

// ---------------------------------------------------------------------------
// Normalized Webhook Event Shapes (PAL §3.1)
// ---------------------------------------------------------------------------
export interface NormalizedInboundMessage {
  providerMessageSid: string;
  from: string; // E.164
  to: string; // E.164
  body: string;
  mediaUrls: string[];
  receivedAt: string; // ISO 8601
}

export interface NormalizedInboundCall {
  providerCallSid: string;
  from: string; // E.164
  to: string; // E.164
  direction: 'inbound';
}

export interface NormalizedStatusEvent {
  providerSid: string; // message or call sid
  resourceType: 'message' | 'call';
  status: string; // normalized VoiceLink status enum
  errorCode?: string;
  timestamp: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// Parameter Types
// ---------------------------------------------------------------------------
export interface NumberSearchParams {
  countryCode: string; // ISO 3166-1 alpha-2
  areaCode?: string;
  capabilities?: string[]; // e.g. ['voice', 'sms']
  limit?: number;
}

export interface WebhookConfig {
  baseUrl: string; // VoiceLink API base URL
  provider: string; // e.g. 'twilio' — used for :provider path segment
}

export interface SendMessageParams {
  from: string; // E.164
  to: string; // E.164
  body: string;
  mediaUrls?: string[];
  statusCallback?: string; // URL for delivery status updates
}

export interface OutboundCallParams {
  from: string; // E.164 caller ID
  to: string; // E.164 destination
  clientIdentity?: string; // WebRTC client identity to connect to
  statusCallback?: string;
  record?: boolean;
  recordingDisclosure?: boolean;
  timeout?: number; // seconds
  machineDetection?: 'Enable' | 'DetectMessageEnd';
}

export interface CallControlAction {
  type:
    | 'dial-client'
    | 'dial-number'
    | 'reject'
    | 'hangup'
    | 'redirect'
    | 'empty';
  clientId?: string;
  number?: string;
  timeout?: number; // seconds
  voicemailRedirect?: string; // URL for voicemail fallback
  redirectUrl?: string;
}

// ---------------------------------------------------------------------------
// Return Types
// ---------------------------------------------------------------------------
export interface AvailableNumber {
  number: string; // E.164
  locality: string;
  region: string;
  countryCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
  monthlyCost: number;
}

export interface ProvisionedNumber {
  providerSid: string;
  number: string; // E.164
  friendlyName?: string;
  countryCode: string;
  capabilities: {
    voice: boolean;
    sms: boolean;
    mms: boolean;
  };
}

export interface ProviderMessageResult {
  providerSid: string;
  status: string; // provider-native status — normalized via status map
}

export interface ProviderCallResult {
  providerCallSid: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Raw Webhook Request (platform-specific shape)
// ---------------------------------------------------------------------------
export interface RawWebhookRequest {
  body: Record<string, unknown> | string;
  headers: Record<string, string | string[] | undefined>;
  query?: Record<string, string>;
  rawBody?: Buffer; // required for Twilio signature verification
}

// ---------------------------------------------------------------------------
// Main Provider Interface (PAL §3)
// ---------------------------------------------------------------------------
export interface TelephonyProvider {
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  // Numbers
  searchAvailableNumbers(
    params: NumberSearchParams,
  ): Promise<AvailableNumber[]>;

  provisionNumber(
    number: string,
    webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber>;

  releaseNumber(providerSid: string): Promise<void>;

  configureNumberWebhooks(
    providerSid: string,
    webhookConfig: WebhookConfig,
  ): Promise<void>;

  // Messaging
  sendMessage(params: SendMessageParams): Promise<ProviderMessageResult>;

  // Calling
  generateClientToken(
    identity: string,
  ): Promise<{ token: string; expiresIn: number }>;

  initiateOutboundCall(
    params: OutboundCallParams,
  ): Promise<ProviderCallResult>;

  generateCallControlResponse(action: CallControlAction): string;

  // Webhooks
  validateWebhookSignature(req: RawWebhookRequest): boolean;

  parseInboundMessageWebhook(
    req: RawWebhookRequest,
  ): NormalizedInboundMessage;

  parseInboundCallWebhook(
    req: RawWebhookRequest,
  ): NormalizedInboundCall;

  parseStatusCallback(
    req: RawWebhookRequest,
  ): NormalizedStatusEvent;

  // Voicemail
  getRecording(
    providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }>;

  transcribeRecording?(
    providerRecordingSid: string,
  ): Promise<string>;
}
