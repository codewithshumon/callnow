import { NotImplementedException } from '@nestjs/common';
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
 * Bandwidth provider — stub implementation (PAL §11 Phase 1).
 * Every method throws NotImplementedException.
 * Will be fully implemented in PAL Phase 3.
 */
export class BandwidthProvider implements TelephonyProvider {
  readonly name = 'bandwidth';

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
    _params: NumberSearchParams,
  ): Promise<AvailableNumber[]> {
    throw new NotImplementedException(
      'BandwidthProvider.searchAvailableNumbers',
    );
  }

  async provisionNumber(
    _number: string,
    _webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber> {
    throw new NotImplementedException('BandwidthProvider.provisionNumber');
  }

  async releaseNumber(_providerSid: string): Promise<void> {
    throw new NotImplementedException('BandwidthProvider.releaseNumber');
  }

  async configureNumberWebhooks(
    _providerSid: string,
    _webhookConfig: WebhookConfig,
  ): Promise<void> {
    throw new NotImplementedException(
      'BandwidthProvider.configureNumberWebhooks',
    );
  }

  async sendMessage(
    _params: SendMessageParams,
  ): Promise<ProviderMessageResult> {
    throw new NotImplementedException('BandwidthProvider.sendMessage');
  }

  async generateClientToken(
    _identity: string,
  ): Promise<{ token: string; expiresIn: number }> {
    throw new NotImplementedException('BandwidthProvider.generateClientToken');
  }

  async initiateOutboundCall(
    _params: OutboundCallParams,
  ): Promise<ProviderCallResult> {
    throw new NotImplementedException('BandwidthProvider.initiateOutboundCall');
  }

  generateCallControlResponse(_action: CallControlAction): string {
    throw new NotImplementedException(
      'BandwidthProvider.generateCallControlResponse',
    );
  }

  validateWebhookSignature(_req: RawWebhookRequest): boolean {
    throw new NotImplementedException(
      'BandwidthProvider.validateWebhookSignature',
    );
  }

  parseInboundMessageWebhook(
    _req: RawWebhookRequest,
  ): NormalizedInboundMessage {
    throw new NotImplementedException(
      'BandwidthProvider.parseInboundMessageWebhook',
    );
  }

  parseInboundCallWebhook(_req: RawWebhookRequest): NormalizedInboundCall {
    throw new NotImplementedException(
      'BandwidthProvider.parseInboundCallWebhook',
    );
  }

  parseStatusCallback(_req: RawWebhookRequest): NormalizedStatusEvent {
    throw new NotImplementedException('BandwidthProvider.parseStatusCallback');
  }

  async getRecording(
    _providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }> {
    throw new NotImplementedException('BandwidthProvider.getRecording');
  }
}
