import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Twilio from 'twilio';
import { twiml as TwilioTwiml } from 'twilio';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const AccessToken = require('twilio/lib/jwt/AccessToken');
const VoiceGrant = AccessToken.VoiceGrant;

import type {
  TelephonyProvider,
  ProviderCapabilities,
  NumberSearchParams,
  WebhookConfig,
  SendMessageParams,
  OutboundCallParams,
  CallControlAction,
  RawWebhookRequest,
  NormalizedInboundMessage,
  NormalizedInboundCall,
  NormalizedStatusEvent,
  AvailableNumber,
  ProvisionedNumber,
  ProviderMessageResult,
  ProviderCallResult,
} from '../interfaces/telephony-provider.interface';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TwilioClient = any;

/**
 * Twilio implementation of the TelephonyProvider interface.
 *
 * This is the only ACTIVE provider in v1. All telephony operations
 * (SMS, voice, number provisioning) go through Twilio's REST API.
 *
 * Ref: PAL §3, PAL §6, PAL §10, SDD §2.3 (WebRTC token)
 */
@Injectable()
export class TwilioProvider implements TelephonyProvider {
  private readonly logger = new Logger(TwilioProvider.name);
  readonly name = 'twilio';

  private readonly client: TwilioClient;
  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly twimlAppSid?: string; // optional TwiML app for WebRTC

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private statusMap: Record<string, any>;

  constructor(private readonly configService: ConfigService) {
    const twilio = configService.get('telephony.twilio');
    this.accountSid = twilio.accountSid;
    this.authToken = twilio.authToken;
    this.apiKey = twilio.apiKey;
    this.apiSecret = twilio.apiSecret;

    if (!this.accountSid || !this.authToken) {
      this.logger.warn(
        'Twilio credentials missing — provider will throw at runtime',
      );
    }

    this.client = Twilio(this.accountSid, this.authToken);
  }

  // ---------------------------------------------------------------------------
  // Capabilities (PAL §10)
  // ---------------------------------------------------------------------------
  readonly capabilities: ProviderCapabilities = {
    voice: true,
    sms: true,
    mms: true,
    voicemailTranscription: true, // Twilio has built-in transcription
    callRecording: true,
    conferenceCalling: true,
    numberPorting: true,
    tollFreeNumbers: true,
    supportedCountries: [
      'US', 'CA', 'GB', 'AU', 'IE', 'NZ', 'ZA',
      'FR', 'DE', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI',
      'JP', 'SG', 'HK', 'BR', 'MX',
    ],
  };

  // ---------------------------------------------------------------------------
  // Numbers (PAL §3)
  // ---------------------------------------------------------------------------

  /** 2.2.2 — Search available local numbers */
  async searchAvailableNumbers(
    params: NumberSearchParams,
  ): Promise<AvailableNumber[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const searchOpts: any = { limit: params.limit || 20 };

    if (params.areaCode) {
      searchOpts.areaCode = parseInt(params.areaCode, 10);
    }

    if (params.capabilities && params.capabilities.length > 0) {
      if (params.capabilities.includes('sms')) searchOpts.smsEnabled = true;
      if (params.capabilities.includes('mms')) searchOpts.mmsEnabled = true;
      if (params.capabilities.includes('voice')) searchOpts.voiceEnabled = true;
    }

    const countryCode = params.countryCode || 'US';

    try {
      const result = await this.client
        .availablePhoneNumbers(countryCode)
        .local.list(searchOpts);

      return result.map(
        (num: {
          phoneNumber: string;
          locality: string;
          region: string;
          isoCountry: string;
          smsEnabled: boolean;
          voiceEnabled: boolean;
          mmsEnabled: boolean;
          monthlyRentalAmount: number;
        }) => ({
          number: num.phoneNumber,
          locality: num.locality || '',
          region: num.region || '',
          countryCode: num.isoCountry || countryCode,
          capabilities: {
            voice: num.voiceEnabled ?? false,
            sms: num.smsEnabled ?? false,
            mms: num.mmsEnabled ?? false,
          },
          monthlyCost: num.monthlyRentalAmount || 1.0,
        }),
      );
    } catch (error) {
      this.logger.error('Failed to search available numbers', error);
      throw error;
    }
  }

  /** 2.2.3 — Provision (buy) a phone number */
  async provisionNumber(
    number: string,
    webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber> {
    try {
      const result = await this.client.incomingPhoneNumbers.create({
        phoneNumber: number,
        voiceUrl: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/voice`,
        voiceMethod: 'POST',
        smsUrl: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/sms`,
        smsMethod: 'POST',
        statusCallback: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/voice/status`,
        statusCallbackMethod: 'POST',
      });

      return {
        providerSid: result.sid,
        number: result.phoneNumber,
        friendlyName: result.friendlyName,
        countryCode: result.isoCountry || 'US',
        capabilities: {
          voice: result.capabilities?.voice ?? false,
          sms: result.capabilities?.sms ?? false,
          mms: result.capabilities?.mms ?? false,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to provision number ${number}`, error);
      throw error;
    }
  }

  /** 2.2.4 — Release (delete) a phone number */
  async releaseNumber(providerSid: string): Promise<void> {
    try {
      await this.client.incomingPhoneNumbers(providerSid).remove();
    } catch (error) {
      this.logger.error(`Failed to release number ${providerSid}`, error);
      throw error;
    }
  }

  /** 2.2.5 — Update webhook URLs on a provisioned number */
  async configureNumberWebhooks(
    providerSid: string,
    webhookConfig: WebhookConfig,
  ): Promise<void> {
    try {
      await this.client.incomingPhoneNumbers(providerSid).update({
        voiceUrl: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/voice`,
        voiceMethod: 'POST',
        smsUrl: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/sms`,
        smsMethod: 'POST',
        statusCallback: `${webhookConfig.baseUrl}/webhooks/${webhookConfig.provider}/voice/status`,
        statusCallbackMethod: 'POST',
      });
    } catch (error) {
      this.logger.error(
        `Failed to configure webhooks for ${providerSid}`,
        error,
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Messaging (PAL §3)
  // ---------------------------------------------------------------------------

  /** 2.2.6 — Send SMS/MMS */
  async sendMessage(params: SendMessageParams): Promise<ProviderMessageResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opts: any = {
        from: params.from,
        to: params.to,
        body: params.body,
      };

      if (params.mediaUrls && params.mediaUrls.length > 0) {
        opts.mediaUrl = params.mediaUrls;
      }

      if (params.statusCallback) {
        opts.statusCallback = params.statusCallback;
      }

      const message = await this.client.messages.create(opts);

      return {
        providerSid: message.sid,
        status: message.status,
      };
    } catch (error) {
      this.logger.error(
        `Failed to send message from ${params.from} to ${params.to}`,
        error,
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Calling (PAL §3, SDD §2.3)
  // ---------------------------------------------------------------------------

  /** 2.2.7 — Generate WebRTC client token with VoiceGrant */
  async generateClientToken(
    identity: string,
  ): Promise<{ token: string; expiresIn: number }> {
    if (!this.apiKey || !this.apiSecret) {
      throw new Error(
        'TWILIO_API_KEY and TWILIO_API_SECRET are required for client tokens',
      );
    }

    const expiresIn = 3300; // 55 minutes per SDD §9
    const token = new AccessToken(
      this.accountSid,
      this.apiKey,
      this.apiSecret,
      { identity, ttl: expiresIn },
    );

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: this.twimlAppSid,
      incomingAllow: true,
    });
    token.addGrant(voiceGrant);

    return {
      token: token.toJwt(),
      expiresIn,
    };
  }

  /** 2.2.8 — Initiate outbound PSTN call */
  async initiateOutboundCall(
    params: OutboundCallParams,
  ): Promise<ProviderCallResult> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callOpts: any = {
        from: params.from,
        to: params.to,
        twiml: this.generateCallControlResponse({
          type: 'dial-client',
          clientId: params.clientIdentity,
          timeout: params.timeout || 30,
        }),
      };

      if (params.statusCallback) {
        callOpts.statusCallback = params.statusCallback;
        callOpts.statusCallbackMethod = 'POST';
        callOpts.statusCallbackEvent = [
          'initiated', 'ringing', 'answered', 'completed',
        ];
      }

      if (params.record) {
        callOpts.record = true;
      }

      if (params.machineDetection) {
        callOpts.machineDetection = params.machineDetection;
      }

      const call = await this.client.calls.create(callOpts);

      return {
        providerCallSid: call.sid,
        status: call.status || 'queued',
      };
    } catch (error) {
      this.logger.error(
        `Failed to initiate call to ${params.to}`,
        error,
      );
      throw error;
    }
  }

  /** 2.2.9 — Generate TwiML call control response */
  generateCallControlResponse(action: CallControlAction): string {
    const twiml = new TwilioTwiml.VoiceResponse();

    switch (action.type) {
      case 'dial-client':
        if (action.clientId) {
          const dial = twiml.dial({
            timeout: action.timeout || 30,
            action: action.voicemailRedirect,
          });
          dial.client(action.clientId);
        }
        break;

      case 'dial-number':
        if (action.number) {
          const dial = twiml.dial({
            timeout: action.timeout || 30,
            action: action.voicemailRedirect,
          });
          dial.number(action.number);
        }
        break;

      case 'reject':
        twiml.reject();
        break;

      case 'hangup':
        twiml.hangup();
        break;

      case 'redirect':
        if (action.redirectUrl) {
          twiml.redirect(action.redirectUrl);
        }
        break;

      case 'empty':
      default:
        // Return empty response — provider will do nothing
        twiml.say({ voice: 'alice' }, '');
        break;
    }

    return twiml.toString();
  }

  // ---------------------------------------------------------------------------
  // Webhook Security & Parsing (PAL §5, PAL §3.1)
  // ---------------------------------------------------------------------------

  /** 2.2.10 — Validate Twilio webhook signature */
  validateWebhookSignature(req: RawWebhookRequest): boolean {
    try {
      const signature = req.headers['x-twilio-signature'] as string;
      if (!signature) {
        this.logger.warn('Missing X-Twilio-Signature header');
        return false;
      }

      // Twilio's validateRequest expects the raw URL and POST params
      // For a robust implementation, we need the full original URL
      const url = (req.headers['x-forwarded-proto'] || 'https') + '://' +
        (req.headers.host || 'localhost') +
        ((req as unknown as { originalUrl?: string }).originalUrl || '/');

      const params: Record<string, string> = {};
      if (typeof req.body === 'string') {
        // URL-encoded body from Twilio
        const parsed = new URLSearchParams(req.body);
        for (const [key, value] of parsed) {
          params[key] = value;
        }
      } else if (typeof req.body === 'object' && req.body !== null) {
        for (const [key, value] of Object.entries(req.body)) {
          if (typeof value === 'string') {
            params[key] = value;
          }
        }
      }

      return Twilio.validateRequest(
        this.authToken,
        signature,
        url,
        params,
      );
    } catch (error) {
      this.logger.error('Webhook signature validation failed', error);
      return false;
    }
  }

  /** 2.2.11 — Parse inbound SMS webhook into normalized shape */
  parseInboundMessageWebhook(
    req: RawWebhookRequest,
  ): NormalizedInboundMessage {
    const body =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : {};

    const numMedia = parseInt(String(body.NumMedia ?? '0'), 10);
    const mediaUrls: string[] = [];
    for (let i = 0; i < numMedia; i++) {
      const url = body[`MediaUrl${i}`] as string;
      if (url) mediaUrls.push(url);
    }

    return {
      providerMessageSid: String(body.MessageSid ?? ''),
      from: String(body.From ?? ''),
      to: String(body.To ?? ''),
      body: String(body.Body ?? ''),
      mediaUrls,
      receivedAt: new Date().toISOString(),
    };
  }

  /** 2.2.12 — Parse inbound call webhook into normalized shape */
  parseInboundCallWebhook(req: RawWebhookRequest): NormalizedInboundCall {
    const body =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : {};

    return {
      providerCallSid: String(body.CallSid ?? ''),
      from: String(body.From ?? ''),
      to: String(body.To ?? ''),
      direction: 'inbound',
    };
  }

  /** 2.2.13 — Parse status callback into normalized shape */
  parseStatusCallback(req: RawWebhookRequest): NormalizedStatusEvent {
    const body =
      typeof req.body === 'object' && req.body !== null
        ? req.body
        : {};

    const isCall = 'CallSid' in body;
    const resourceType: 'message' | 'call' = isCall ? 'call' : 'message';
    const providerSid = String(
      isCall ? body.CallSid : body.MessageSid ?? '',
    );
    const rawStatus = String(
      isCall ? body.CallStatus : body.MessageStatus ?? body.SmsStatus ?? '',
    );

    // Normalize status via the status map
    const normalizedStatus = this.normalizeStatus(rawStatus, resourceType);

    return {
      providerSid,
      resourceType,
      status: normalizedStatus,
      errorCode: body.ErrorCode ? String(body.ErrorCode) : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  /** 2.2.14 — Fetch recording media URL */
  async getRecording(
    providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }> {
    try {
      const recording = await this.client
        .recordings(providerRecordingSid)
        .fetch();

      return {
        url: `${recording.uri.replace('.json', '.mp3')}`,
        durationSeconds: parseInt(recording.duration || '0', 10),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch recording ${providerRecordingSid}`,
        error,
      );
      throw error;
    }
  }

  /** 2.2.15 — Transcribe recording using Twilio's built-in API */
  async transcribeRecording(providerRecordingSid: string): Promise<string> {
    try {
      const transcriptions = await this.client
        .transcriptions.list({
          recordingSid: providerRecordingSid,
          limit: 1,
        });

      if (transcriptions.length > 0 && transcriptions[0].transcriptionText) {
        return transcriptions[0].transcriptionText;
      }

      return '';
    } catch (error) {
      this.logger.error(
        `Failed to transcribe recording ${providerRecordingSid}`,
        error,
      );
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Status Normalization (PAL §6)
  // ---------------------------------------------------------------------------

  /**
   * Load the Twilio→VoiceLink status map JSON and cache it.
   */
  private loadStatusMap(): Record<string, Record<string, string>> {
    try {
      // Dynamic require — JSON maps are loaded at runtime
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../status-maps/twilio.json');
    } catch {
      this.logger.warn('Status map not found — using empty map');
      return { message: {}, call: {} };
    }
  }

  /**
   * Normalize a Twilio provider status string to VoiceLink internal enum.
   * Uses the status-maps/twilio.json mapping table. Falls back to raw status.
   */
  private normalizeStatus(
    rawStatus: string,
    resourceType: 'message' | 'call',
  ): string {
    if (!this.statusMap) {
      this.statusMap = this.loadStatusMap();
    }

    const map = this.statusMap[resourceType];
    if (map && map[rawStatus]) {
      return map[rawStatus];
    }

    // Fallback: return the raw status in lowercase
    return rawStatus.toLowerCase();
  }
}
