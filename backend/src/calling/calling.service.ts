import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';
import { RedisService } from '../redis/redis.service';

const CALL_TOKEN_TTL = 55 * 60; // SDD §9: 55 minutes

@Injectable()
export class CallingService {
  private readonly logger = new Logger(CallingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    private readonly redis: RedisService,
  ) {}

  // 6.1.2 — Generate WebRTC client token
  async getCallToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });

    const { token, expiresIn } =
      await this.telephonyProvider.generateClientToken(user.id);

    // Cache token in Redis
    await this.redis.setex(`webrtc:token:${userId}`, CALL_TOKEN_TTL, token);

    return {
      token,
      expiresIn,
      provider: this.telephonyProvider.name,
    };
  }

  // 6.1.3 — Get call history (paginated)
  async getCallHistory(
    userId: string,
    page = 1,
    limit = 20,
    direction?: 'inbound' | 'outbound',
  ) {
    // Auto-sync latest calls from provider so outgoing/incoming/missed calls appear immediately
    await this.syncTwilioCalls(userId);

    const where: Record<string, unknown> = { userId };
    if (direction) where.direction = direction;

    const [data, total] = await Promise.all([
      this.prisma.call.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.call.count({ where }),
    ]);

    return { data, meta: { page, limit, total } };
  }

  async syncTwilioCalls(userId: string) {
    if (typeof (this.telephonyProvider as any).listRecentCalls !== 'function') return;
    try {
      const calls = await (this.telephonyProvider as any).listRecentCalls(50);
      for (const c of calls) {
        // Skip child client leg if it's the internal WebRTC connection (e.g. from: "client:...")
        const isClientLeg = c.from?.startsWith('client:') && c.direction === 'inbound';
        if (isClientLeg) continue;

        const direction = c.direction?.includes('outbound') ? 'outbound' : 'inbound';
        const duration = parseInt(c.duration || '0', 10);
        const cost = c.price ? Math.abs(parseFloat(c.price)) : undefined;

        await this.prisma.call.upsert({
          where: { providerCallSid: c.sid },
          create: {
            userId,
            providerCallSid: c.sid,
            provider: this.telephonyProvider.name || 'twilio',
            fromNumber: c.from || 'Unknown',
            toNumber: c.to || 'Unknown',
            direction,
            status: c.status || 'completed',
            durationSeconds: duration,
            cost,
            startedAt: c.startTime ? new Date(c.startTime) : new Date(c.dateCreated),
            endedAt: c.endTime ? new Date(c.endTime) : undefined,
            createdAt: new Date(c.dateCreated),
          },
          update: {
            status: c.status || 'completed',
            durationSeconds: duration,
            cost,
            startedAt: c.startTime ? new Date(c.startTime) : undefined,
            endedAt: c.endTime ? new Date(c.endTime) : undefined,
          },
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to auto-sync Twilio calls: ${err}`);
    }
  }

  // 6.1.4 — Create a CDR row
  async createCallRecord(
    userId: string,
    providerCallSid: string,
    provider: string,
    fromNumber: string,
    toNumber: string,
    direction: 'inbound' | 'outbound',
  ) {
    return this.prisma.call.create({
      data: {
        userId,
        providerCallSid,
        provider,
        fromNumber,
        toNumber,
        direction,
        status: 'initiated',
        startedAt: new Date(),
      },
    });
  }

  // Save local zero-cost audio recording
  async saveCallRecording(userId: string, callSid: string, filename: string) {
    const recordingUrl = `/api/v1/calls/recordings/${filename}`;

    const existing = await this.prisma.call.findFirst({
      where: {
        OR: [
          { providerCallSid: callSid },
          ...(callSid.length === 36 ? [{ id: callSid }] : []),
        ],
      },
    });

    if (existing) {
      return this.prisma.call.update({
        where: { id: existing.id },
        data: { recordingUrl },
      });
    } else {
      return this.prisma.call.create({
        data: {
          userId,
          providerCallSid: callSid,
          provider: 'twilio',
          fromNumber: 'Browser',
          toNumber: 'Outbound',
          direction: 'outbound',
          status: 'completed',
          recordingUrl,
          startedAt: new Date(),
          endedAt: new Date(),
        },
      });
    }
  }

  // --- Voicemail helpers (used by webhook + controller) ---

  async getVoicemails(userId: string) {
    return this.prisma.voicemail.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markVoicemailRead(userId: string, voicemailId: string) {
    const voicemail = await this.prisma.voicemail.findFirst({
      where: { id: voicemailId, userId },
    });
    if (!voicemail)
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Voicemail not found',
      });

    return this.prisma.voicemail.update({
      where: { id: voicemailId },
      data: { isRead: true },
    });
  }

  async getVoicemailRecording(userId: string, voicemailId: string) {
    const voicemail = await this.prisma.voicemail.findFirst({
      where: { id: voicemailId, userId },
    });
    if (!voicemail)
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Voicemail not found',
      });
    return { url: voicemail.recordingUrl };
  }
}
