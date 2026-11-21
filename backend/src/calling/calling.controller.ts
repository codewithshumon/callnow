import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Req,
  UseGuards,
  HttpCode,
  Res,
  NotFoundException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import type { Response } from 'express';
import { CallingService } from './calling.service';
import { CallQueryDto } from './dto/call-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class CallingController {
  constructor(private readonly callingService: CallingService) {}

  // 6.1.2 — WebRTC client token
  @Get('calls/token')
  async getCallTokenGet(@CurrentUser('id') userId: string) {
    return this.callingService.getCallToken(userId);
  }

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
      query.hasRecording === 'true',
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
    const { url } = await this.callingService.getVoicemailRecording(userId, id);
    if (!url || (!url.startsWith('https://') && !url.startsWith('http://'))) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Recording not available',
      });
    }
    return res.redirect(url);
  }

  // Upload locally recorded call audio (Zero Twilio Recording Cost)
  @Post('calls/:callSid/recording')
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'recordings');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, _file, cb) => {
          const rawSid = Array.isArray(req.params.callSid)
            ? req.params.callSid[0]
            : req.params.callSid || '';
          const sid = (rawSid || `call-${Date.now()}`).replace(
            /[^a-zA-Z0-9_-]/g,
            '',
          );
          cb(null, `${sid}.webm`);
        },
      }),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB max for long recordings
      },
    }),
  )
  async uploadCallRecording(
    @CurrentUser('id') userId: string,
    @Param('callSid') callSid: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    const filename = file?.filename || `${callSid}.webm`;
    const toNumber = req.body?.toNumber;
    const fromNumber = req.body?.fromNumber;
    const direction = req.body?.direction;
    return this.callingService.saveCallRecording(userId, callSid, filename, {
      toNumber,
      fromNumber,
      direction,
    });
  }

  // Delete all call recordings
  @Delete('calls/recordings/all')
  async deleteAllCallRecordings(@CurrentUser('id') userId: string) {
    return this.callingService.deleteAllCallRecordings(userId);
  }

  // Delete call recording
  @Delete('calls/:id/recording')
  async deleteCallRecording(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.callingService.deleteCallRecording(userId, id);
  }

  // Stream local call recording audio
  @Get('calls/recordings/:filename')
  @Public()
  async getLocalRecording(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(
      process.cwd(),
      'uploads',
      'recordings',
      sanitizedFilename,
    );
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Call recording not found',
      });
    }
    res.setHeader('Content-Type', 'audio/webm');
    return res.sendFile(filePath);
  }
}
