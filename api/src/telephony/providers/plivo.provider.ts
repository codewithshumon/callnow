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
 * Plivo provider — stub implementation (PAL §11 Phase 1).
 * Every method throws NotImplementedException.
 * Will be implemented in PAL Phase 3 on demand.
 */
export class PlivoProvider implements TelephonyProvider {
  readonly name = 'plivo';

  readonly capabilities: ProviderCapabilities = {
    voice: true,
    sms: true,
    mms: true,
    voicemailTranscription: false, // Requires external STT per PAL §10
    callRecording: true,
    conferenceCalling: true,
    numberPorting: true,
    tollFreeNumbers: true,
    supportedCountries: ['US', 'CA', 'GB', 'AU'],
  };

  async searchAvailableNumbers(
    _params: NumberSearchParams,
  ): Promise<AvailableNumber[]> {
    throw new NotImplementedException(
      'PlivoProvider.searchAvailableNumbers',
    );
  }

  async provisionNumber(
    _number: string,
    _webhookConfig: WebhookConfig,
  ): Promise<ProvisionedNumber> {
    throw new NotImplementedException('PlivoProvider.provisionNumber');
  }

  async releaseNumber(_providerSid: string): Promise<void> {
    throw new NotImplementedException('PlivoProvider.releaseNumber');
  }

  async configureNumberWebhooks(
    _providerSid: string,
    _webhookConfig: WebhookConfig,
  ): Promise<void> {
    throw new NotImplementedException(
      'PlivoProvider.configureNumberWebhooks',
    );
  }

  async sendMessage(
    _params: SendMessageParams,
  ): Promise<ProviderMessageResult> {
    throw new NotImplementedException('PlivoProvider.sendMessage');
  }

  async generateClientToken(
    _identity: string,
  ): Promise<{ token: string; expiresIn: number }> {
    throw new NotImplementedException('PlivoProvider.generateClientToken');
  }

  async initiateOutboundCall(
    _params: OutboundCallParams,
  ): Promise<ProviderCallResult> {
    throw new NotImplementedException('PlivoProvider.initiateOutboundCall');
  }

  generateCallControlResponse(_action: CallControlAction): string {
    throw new NotImplementedException(
      'PlivoProvider.generateCallControlResponse',
    );
  }

  validateWebhookSignature(_req: RawWebhookRequest): boolean {
    throw new NotImplementedException(
      'PlivoProvider.validateWebhookSignature',
    );
  }

  parseInboundMessageWebhook(
    _req: RawWebhookRequest,
  ): NormalizedInboundMessage {
    throw new NotImplementedException(
      'PlivoProvider.parseInboundMessageWebhook',
    );
  }

  parseInboundCallWebhook(_req: RawWebhookRequest): NormalizedInboundCall {
    throw new NotImplementedException(
      'PlivoProvider.parseInboundCallWebhook',
    );
  }

  parseStatusCallback(_req: RawWebhookRequest): NormalizedStatusEvent {
    throw new NotImplementedException('PlivoProvider.parseStatusCallback');
  }

  async getRecording(
    _providerRecordingSid: string,
  ): Promise<{ url: string; durationSeconds: number }> {
    throw new NotImplementedException('PlivoProvider.getRecording');
  }
}
