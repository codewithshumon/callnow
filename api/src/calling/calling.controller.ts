import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  UseGuards,
  HttpCode,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { CallingService } from './calling.service';
import { CallQueryDto } from './dto/call-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallingController {
  constructor(private readonly callingService: CallingService) {}

  // 6.1.2
  @Post('calls/token')
  async getCallToken(@CurrentUser('id') userId: string) {
    return this.callingService.getCallToken(userId);
  }

  // 6.1.3
  @Get('calls')
  async getCallHistory(
    @CurrentUser('id') userId: string,
    @Query() query: CallQueryDto,
  ) {
    return this.callingService.getCallHistory(
      userId,
      query.page,
      query.limit,
      query.direction,
    );
  }

  // 6.4.1 — List voicemails
  @Get('voicemails')
  async getVoicemails(@CurrentUser('id') userId: string) {
    return this.callingService.getVoicemails(userId);
  }

  // 6.4.2 — Mark voicemail as read
  @Patch('voicemails/:id')
  @HttpCode(200)
  async markVoicemailRead(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.callingService.markVoicemailRead(userId, id);
  }

  // 6.4.3 — Get voicemail recording (redirect to signed URL)
  @Get('voicemails/:id/recording')
  async getVoicemailRecording(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { url } = await this.callingService.getVoicemailRecording(
      userId,
      id,
    );
    if (!url) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Recording not available',
      });
    }
    return res.redirect(url);
  }
}
