import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

const CALL_TOKEN_TTL = 55 * 60; // SDD §9: 55 minutes

@Injectable()
export class CallingService {
  private readonly logger = new Logger(CallingService.name);
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    configService: ConfigService,
  ) {
    this.redis = new Redis(
      configService.get<string>('redis.url') || 'redis://localhost:6379',
    );
  }

  // 6.1.2 — Generate WebRTC client token
  async getCallToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) throw new Error('User not found');

    const { token, expiresIn } =
      await this.telephonyProvider.generateClientToken(user.id);

    // Cache token in Redis
    await this.redis.setex(
      `webrtc:token:${userId}`,
      CALL_TOKEN_TTL,
      token,
    );

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
    if (!voicemail) throw new Error('Voicemail not found');

    return this.prisma.voicemail.update({
      where: { id: voicemailId },
      data: { isRead: true },
    });
  }

  async getVoicemailRecording(userId: string, voicemailId: string) {
    const voicemail = await this.prisma.voicemail.findFirst({
      where: { id: voicemailId, userId },
    });
    if (!voicemail) throw new Error('Voicemail not found');
    return { url: voicemail.recordingUrl };
  }
}
