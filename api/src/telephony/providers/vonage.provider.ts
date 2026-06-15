import { NotImplementedException, Logger } from '@nestjs/common';
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
 * Vonage provider — stub implementation (PAL §11 Phase 1).
 * Every method throws NotImplementedException.
 * Will be fully implemented in PAL Phase 2.
 */
export class VonageProvider implements TelephonyProvider {
  private readonly logger = new Logger(VonageProvider.name);
  readonly name = 'vonage';

  readonly capabilities: ProviderCapabilities = {
    voice: true,
    sms: true,
    mms: false, // Limited US only per PAL §10
    voicemailTranscription: false, // Requires external STT
    callRecording: true,
    conferenceCalling: true,
    numberPorting: true,
    tollFreeNumbers: true,
    supportedCountries: ['US', 'CA', 'GB'],
  };

  async searchAvailableNumbers(
    _params: NumberSearchParams,
  ): Promise<AvailableNumber[]> {
    throw new NotImplementedException('VonageProvider.searchAvailableNumbers');
  }

  async provisionNumber(
    _number: string,
    _webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber> {
    throw new NotImplementedException('VonageProvider.provisionNumber');
  }

  async releaseNumber(_providerSid: string): Promise<void> {
    throw new NotImplementedException('VonageProvider.releaseNumber');
  }

  async configureNumberWebhooks(
    _providerSid: string,
    _webhookConfig: WebhookConfig,
  ): Promise<void> {
    throw new NotImplementedException(
      'VonageProvider.configureNumberWebhooks',
    );
  }

  async sendMessage(
    _params: SendMessageParams,
  ): Promise<ProviderMessageResult> {
    throw new NotImplementedException('VonageProvider.sendMessage');
  }

  async generateClientToken(
    _identity: string,
  ): Promise<{ token: string; expiresIn: number }> {
    throw new NotImplementedException('VonageProvider.generateClientToken');
  }

  async initiateOutboundCall(
    _params: OutboundCallParams,
  ): Promise<ProviderCallResult> {
    throw new NotImplementedException('VonageProvider.initiateOutboundCall');
  }

  generateCallControlResponse(_action: CallControlAction): string {
    throw new NotImplementedException(
      'VonageProvider.generateCallControlResponse',
    );
  }

  validateWebhookSignature(_req: RawWebhookRequest): boolean {
    throw new NotImplementedException('VonageProvider.validateWebhookSignature');
  }

  parseInboundMessageWebhook(
    _req: RawWebhookRequest,
  ): NormalizedInboundMessage {
    throw new NotImplementedException(
      'VonageProvider.parseInboundMessageWebhook',
    );
  }

  parseInboundCallWebhook(_req: RawWebhookRequest): NormalizedInboundCall {
    throw new NotImplementedException(
      'VonageProvider.parseInboundCallWebhook',
    );
  }

  parseStatusCallback(_req: RawWebhookRequest): NormalizedStatusEvent {
    throw new NotImplementedException('VonageProvider.parseStatusCallback');
  }

  async getRecording(
    _providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }> {
    throw new NotImplementedException('VonageProvider.getRecording');
  }
}
