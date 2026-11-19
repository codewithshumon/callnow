import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Public } from '../../common/decorators/public.decorator';
import { DialerService } from '../dialer.service';

@Controller('internal/dialer')
@Public()
export class DialerCallbackController {
  private readonly logger = new Logger(DialerCallbackController.name);
  private readonly internalApiKey: string;

  constructor(
    private readonly dialerService: DialerService,
    configService: ConfigService,
  ) {
    this.internalApiKey =
      configService.get<string>('app.internalApiKey') || 'change-me';
  }

  @Post('callback')
  async handleProgress(
    @Headers('authorization') authHeader: string,
    @Body()
    body: {
      campaignId: string;
      dialed: number;
      answered: number;
      failed: number;
      busy: number;
      noAnswer: number;
      remaining: number;
    },
  ) {
    // 8.4.3 — Validate INTERNAL_API_KEY with timing-safe comparison
    const token = authHeader?.replace('Bearer ', '');
    const isTokenValid =
      token &&
      this.internalApiKey &&
      token.length === this.internalApiKey.length &&
      crypto.timingSafeEqual(
        Buffer.from(token),
        Buffer.from(this.internalApiKey),
      );

    if (!isTokenValid) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid internal API key',
      });
    }

    this.logger.log(
      `Progress callback: campaign ${body.campaignId} — ${body.dialed} dialed`,
    );

    return this.dialerService.handleProgressCallback(body.campaignId, body);
  }
}
