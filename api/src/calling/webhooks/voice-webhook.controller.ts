import {
  Controller,
  Post,
  Param,
  Req,
  UseGuards,
  Inject,
  Logger,
} from '@nestjs/common';
import type { Request } from 'express';
import { WebhookSignatureGuard } from '../../telephony/guards/webhook-signature.guard';
import type {
  TelephonyProvider,
  RawWebhookRequest,
} from '../../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../../telephony/telephony.module';
import { PrismaService } from '../../prisma/prisma.service';
import { NumbersService } from '../../numbers/numbers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('webhooks')
export class VoiceWebhookController {
  private readonly logger = new Logger(VoiceWebhookController.name);

  constructor(
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    private readonly prisma: PrismaService,
    private readonly numbersService: NumbersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private toRaw(req: Request): RawWebhookRequest {
    return {
      body: req.body as Record<string, unknown>,
      headers: req.headers as Record<string, string | string[] | undefined>,
      rawBody: (req as unknown as { rawBody?: Buffer }).rawBody,
    };
  }

  // 6.2.2 — Inbound call
  @Post(':provider/voice')
  @UseGuards(WebhookSignatureGuard)
  async handleInboundCall(
    @Param('provider') _providerName: string,
    @Req() req: Request,
  ) {
    const raw = this.toRaw(req);
    const normalized = this.telephonyProvider.parseInboundCallWebhook(raw);

    // Lookup owner by the "to" number
    const ownerId = await this.numbersService.getUserByNumber(normalized.to);

    if (!ownerId) {
      return this.telephonyProvider.generateCallControlResponse({
        type: 'reject',
      });
    }

    // Create CDR
    const call = await this.prisma.call.create({
      data: {
        userId: ownerId,
        providerCallSid: normalized.providerCallSid,
        provider: this.telephonyProvider.name,
        fromNumber: normalized.from,
        toNumber: normalized.to,
        direction: 'inbound',
        status: 'ringing',
        startedAt: new Date(),
      },
    });

    // Emit WebSocket event
    this.eventEmitter.emit('call:inbound', {
      userId: ownerId,
      callData: {
        callSid: normalized.providerCallSid,
        from: normalized.from,
        to: normalized.to,
      },
    });

    return this.telephonyProvider.generateCallControlResponse({
      type: 'dial-client',
      clientId: ownerId,
      timeout: 30,
      voicemailRedirect: `/webhooks/${_providerName}/voice/voicemail?userId=${ownerId}`,
    });
  }

  // 6.2.3 — Call status callback
  @Post(':provider/voice/status')
  @UseGuards(WebhookSignatureGuard)
  async handleCallStatus(
    @Param('provider') _providerName: string,
    @Req() req: Request,
  ) {
    const raw = this.toRaw(req);
    const normalized = this.telephonyProvider.parseStatusCallback(raw);

    const call = await this.prisma.call.findUnique({
      where: { providerCallSid: normalized.providerSid },
    });

    if (!call) {
      this.logger.warn(`Status for unknown call: ${normalized.providerSid}`);
      return { success: true };
    }

    const updates: Record<string, unknown> = { status: normalized.status };

    if (normalized.status === 'completed') {
      updates.endedAt = new Date();
      if (call.startedAt) {
        updates.durationSeconds = Math.round(
          (Date.now() - call.startedAt.getTime()) / 1000,
        );
      }
    }

    await this.prisma.call.update({
      where: { id: call.id },
      data: updates as Parameters<typeof this.prisma.call.update>[0]['data'],
    });

    this.eventEmitter.emit('call:status', {
      userId: call.userId,
      callSid: normalized.providerSid,
      status: normalized.status,
      duration: updates.durationSeconds,
    });

    return { success: true };
  }

  // 6.2.4 — Voicemail recording
  @Post(':provider/voice/voicemail')
  @UseGuards(WebhookSignatureGuard)
  async handleVoicemail(
    @Param('provider') _providerName: string,
    @Req() req: Request,
  ) {
    const body = req.body as Record<string, unknown>;
    const recordingUrl = (body.RecordingUrl as string) || '';
    const recordingDuration = parseInt(
      (body.RecordingDuration as string) || '0',
      10,
    );
    const callSid = (body.CallSid as string) || '';
    const userId = (req.query as Record<string, string>).userId || '';

    // Try transcription via provider, fall back to external STT
    let transcript = '';
    let transcriptionSource: 'provider' | 'external-stt' | null = null;

    if (this.telephonyProvider.transcribeRecording) {
      try {
        transcript =
          await this.telephonyProvider.transcribeRecording(recordingUrl);
        transcriptionSource = 'provider';
      } catch {
        this.logger.warn('Provider transcription failed, using external STT');
      }
    }

    if (!transcript) {
      // External STT fallback (OpenAI Whisper) — deferred to a job
      transcriptionSource = 'external-stt';
    }

    // Find the call to link
    let callId: string | null = null;
    if (callSid) {
      const call = await this.prisma.call.findUnique({
        where: { providerCallSid: callSid },
      });
      callId = call?.id || null;
    }

    const voicemail = await this.prisma.voicemail.create({
      data: {
        callId,
        userId: userId || 'unknown',
        fromNumber: (body.From as string) || '',
        recordingUrl,
        transcript: transcript || null,
        transcriptionSource,
        durationSeconds: recordingDuration || 0,
      },
    });

    this.logger.log(`Voicemail stored: ${voicemail.id}`);
    return { success: true };
  }
}
