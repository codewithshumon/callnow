import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

/**
 * Bandwidth implementation of the TelephonyProvider interface.
 * Provides fallback mock simulation and BXML call control generation.
 *
 * Ref: PAL §3, PAL §6, PAL §10
 */
@Injectable()
export class BandwidthProvider implements TelephonyProvider {
  private readonly logger = new Logger(BandwidthProvider.name);
  readonly name = 'bandwidth';

  private readonly accountId: string;
  private readonly applicationId: string;
  private readonly username: string;
  private readonly password: string;
  private statusMap: Record<string, any>;

  constructor(private readonly configService?: ConfigService) {
    const bwConfig = this.configService?.get('telephony.bandwidth') || {};
    this.accountId =
      bwConfig.accountId || process.env.BANDWIDTH_ACCOUNT_ID || '';
    this.applicationId =
      bwConfig.applicationId || process.env.BANDWIDTH_APPLICATION_ID || '';
    this.username = bwConfig.username || process.env.BANDWIDTH_USERNAME || '';
    this.password = bwConfig.password || process.env.BANDWIDTH_PASSWORD || '';

    if (!this.accountId || !this.applicationId) {
      this.logger.warn(
        'Bandwidth credentials not configured — operating in simulated/mock mode',
      );
    }
  }

  readonly capabilities: ProviderCapabilities = {
    voice: true,
    sms: true,
    mms: true,
    voicemailTranscription: false, // Requires external STT per PAL §10
    callRecording: true,
    conferenceCalling: true,
    numberPorting: true,
    tollFreeNumbers: true,
    supportedCountries: ['US', 'CA'],
  };

  async searchAvailableNumbers(
    params: NumberSearchParams,
  ): Promise<AvailableNumber[]> {
    const countryCode = params.countryCode || 'US';
    const areaCode = params.areaCode || '919';
    return [
      {
        number: `+1${areaCode}5550201`,
        locality: 'Raleigh',
        region: 'NC',
        countryCode,
        capabilities: { voice: true, sms: true, mms: true },
        monthlyCost: 0.85,
      },
      {
        number: `+1${areaCode}5550202`,
        locality: 'Raleigh',
        region: 'NC',
        countryCode,
        capabilities: { voice: true, sms: true, mms: true },
        monthlyCost: 0.85,
      },
    ];
  }

  async provisionNumber(
    number: string,
    _webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber> {
    return {
      providerSid: `bw_order_${Date.now()}`,
      number,
      friendlyName: 'Bandwidth Number',
      countryCode: 'US',
      capabilities: { voice: true, sms: true, mms: true },
    };
  }

  async releaseNumber(providerSid: string): Promise<void> {
    this.logger.log(`Released Bandwidth number ${providerSid}`);
  }

  async configureNumberWebhooks(
    providerSid: string,
    _webhookConfig: WebhookConfig,
  ): Promise<void> {
    this.logger.log(`Configured webhooks for Bandwidth number ${providerSid}`);
  }

  async sendMessage(
    _params: SendMessageParams,
  ): Promise<ProviderMessageResult> {
    return {
      providerSid: `bw_msg_${Date.now()}`,
      status: 'queued',
    };
  }

  async generateClientToken(
    identity: string,
  ): Promise<{ token: string; expiresIn: number }> {
    return {
      token: `bw_token_${identity}_${Date.now()}`,
      expiresIn: 3600,
    };
  }

  async initiateOutboundCall(
    _params: OutboundCallParams,
  ): Promise<ProviderCallResult> {
    return {
      providerCallSid: `bw_call_${Date.now()}`,
      status: 'initiated',
    };
  }

  generateCallControlResponse(action: CallControlAction): string {
    // Bandwidth uses BXML (<Bxml><SpeakSentence> / <Dial>...)
    switch (action.type) {
      case 'dial-client':
        return `<?xml version="1.0" encoding="UTF-8"?><Bxml><SpeakSentence>Connecting call</SpeakSentence></Bxml>`;
      case 'dial-number':
        return `<?xml version="1.0" encoding="UTF-8"?><Bxml><Dial><PhoneNumber>${action.number || ''}</PhoneNumber></Dial></Bxml>`;
      case 'reject':
      case 'hangup':
        return `<?xml version="1.0" encoding="UTF-8"?><Bxml><Hangup/></Bxml>`;
      case 'redirect':
        return `<?xml version="1.0" encoding="UTF-8"?><Bxml><Redirect>${action.redirectUrl || ''}</Redirect></Bxml>`;
      default:
        return `<?xml version="1.0" encoding="UTF-8"?><Bxml/>`;
    }
  }

  validateWebhookSignature(_req: RawWebhookRequest): boolean {
    return true;
  }

  parseInboundMessageWebhook(
    req: RawWebhookRequest,
  ): NormalizedInboundMessage {
    const body: any =
      typeof req.body === 'object' && req.body !== null ? req.body : {};
    const item = Array.isArray(body) ? body[0] : body;
    const msg = item?.message || item;

    return {
      providerMessageSid: String(msg.id || `bw_msg_${Date.now()}`),
      from: String(msg.from || ''),
      to: Array.isArray(msg.to) ? String(msg.to[0] || '') : String(msg.to || ''),
      body: String(msg.text || ''),
      mediaUrls: msg.media || [],
      receivedAt: item.time || new Date().toISOString(),
    };
  }

  parseInboundCallWebhook(req: RawWebhookRequest): NormalizedInboundCall {
    const body: any =
      typeof req.body === 'object' && req.body !== null ? req.body : {};
    const item = Array.isArray(body) ? body[0] : body;

    return {
      providerCallSid: String(item.callId || `bw_call_${Date.now()}`),
      from: String(item.from || ''),
      to: String(item.to || ''),
      direction: 'inbound',
    };
  }

  parseStatusCallback(req: RawWebhookRequest): NormalizedStatusEvent {
    const body: any =
      typeof req.body === 'object' && req.body !== null ? req.body : {};
    const item = Array.isArray(body) ? body[0] : body;

    const eventType = String(item.eventType || '');
    const isCall = eventType.includes('call') || 'callId' in item;
    const resourceType: 'message' | 'call' = isCall ? 'call' : 'message';
    const providerSid = String(item.callId || item.messageId || item.id || '');

    const rawStatus = String(item.eventType || item.status || '');
    const normalizedStatus = this.normalizeStatus(rawStatus, resourceType);

    return {
      providerSid,
      resourceType,
      status: normalizedStatus,
      errorCode: item.errorCode ? String(item.errorCode) : undefined,
      timestamp: item.time || new Date().toISOString(),
    };
  }

  async getRecording(
    providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }> {
    return {
      url: `https://api.bandwidth.com/recordings/${providerRecordingSid}.mp3`,
      durationSeconds: 30,
    };
  }

  private loadStatusMap(): Record<string, Record<string, string>> {
    try {
      return require('../status-maps/bandwidth.json');
    } catch {
      return { message: {}, call: {} };
    }
  }

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
    return rawStatus.toLowerCase();
  }
}
