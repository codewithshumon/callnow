import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { TelephonyProvider } from './interfaces/telephony-provider.interface';
import { TwilioProvider } from './providers/twilio.provider';
import { VonageProvider } from './providers/vonage.provider';
import { BandwidthProvider } from './providers/bandwidth.provider';
import { PlivoProvider } from './providers/plivo.provider';
import { TelnyxProvider } from './providers/telnyx.provider';

/**
 * Provider injection token.
 * All consuming services use @Inject(TELEPHONY_PROVIDER) instead of
 * importing a concrete provider directly.
 *
 * Ref: PAL §4.2
 */
export const TELEPHONY_PROVIDER = 'TELEPHONY_PROVIDER';

/**
 * TelephonyModule — global provider factory.
 *
 * Selects the active TelephonyProvider implementation based on the
 * TELEPHONY_PROVIDER environment variable. No code changes are required
 * to switch providers — only credentials and the env var.
 *
 * Ref: PAL §4.2, SDD §3.1 (telephony/)
 */
@Global()
@Module({
  providers: [
    {
      provide: TELEPHONY_PROVIDER,
      useFactory: (configService: ConfigService): TelephonyProvider => {
        const providerName = configService
          .get<string>('telephony.provider')
          ?.toLowerCase();

        switch (providerName) {
          case 'twilio':
            return new TwilioProvider(configService);
          case 'vonage':
            return new VonageProvider();
          case 'bandwidth':
            return new BandwidthProvider();
          case 'plivo':
            return new PlivoProvider();
          case 'telnyx':
            return new TelnyxProvider();
          default:
            throw new Error(
              `Unsupported TELEPHONY_PROVIDER: "${providerName}". ` +
              `Valid values: twilio, vonage, bandwidth, plivo, telnyx`,
            );
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [TELEPHONY_PROVIDER],
})
export class TelephonyModule {}
