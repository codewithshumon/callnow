import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Logger,
} from '@nestjs/common';
import type { TelephonyProvider } from '../interfaces/telephony-provider.interface';
import type { RawWebhookRequest } from '../interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony.module';

/**
 * WebhookSignatureGuard — validates incoming webhook requests from telephony
 * providers using the active provider's signature verification mechanism.
 *
 * Applied to all webhook routes: POST /webhooks/:provider/voice, etc.
 * The :provider path param determines which provider implementation validates
 * the request.
 *
 * Ref: SDD §3.4, PAL §5, SRS SR-05
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);

  constructor(
    @Inject(TELEPHONY_PROVIDER)
    private readonly provider: TelephonyProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const providerName = request.params?.provider;

    // If the :provider param doesn't match the active provider,
    // still validate (the provider's own validate method handles
    // the signature check regardless)
    const rawWebhookRequest: RawWebhookRequest = {
      body: request.body,
      headers: request.headers,
      query: request.query as Record<string, string>,
      rawBody: request.rawBody,
    };

    const isValid = this.provider.validateWebhookSignature(rawWebhookRequest);

    if (!isValid) {
      this.logger.warn(
        `Invalid webhook signature for provider: ${providerName}`,
      );
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Invalid webhook signature',
      });
    }

    return true;
  }
}
