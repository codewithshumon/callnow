import {
  Controller,
  Post,
  Body,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DialerService } from '../dialer.service';

@Controller('internal/dialer')
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
    // 8.4.3 — Validate INTERNAL_API_KEY
    const token = authHeader?.replace('Bearer ', '');
    if (!token || token !== this.internalApiKey) {
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
