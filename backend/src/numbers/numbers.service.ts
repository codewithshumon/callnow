import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';

const NUMBER_USER_CACHE_TTL = 24 * 60 * 60; // SDD §9: 24h TTL

@Injectable()
export class NumbersService {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
    configService: ConfigService,
  ) {
    this.redis = new Redis(
      configService.get<string>('redis.url') || 'redis://localhost:6383',
    );
  }

  // 4.1.2 — Get user's numbers
  async getMyNumbers(userId: string) {
    return this.prisma.phoneNumber.findMany({
      where: { userId, status: { not: 'released' } },
    });
  }

  // 4.1.3 — Search available numbers via PAL
  async searchAvailableNumbers(
    countryCode: string,
    areaCode?: string,
    capabilities?: string,
  ) {
    const caps = capabilities
      ? capabilities.split(',').map((c) => c.trim().toLowerCase())
      : [];

    return this.telephonyProvider.searchAvailableNumbers({
      countryCode,
      areaCode,
      capabilities: caps,
      limit: 20,
    });
  }

  // 4.1.4 — Provision a number
  async provisionNumber(userId: string, number: string) {
    // Check plan limit
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription || !subscription.plan) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: 'No active plan',
      });
    }

    const activeNumbers = await this.prisma.phoneNumber.count({
      where: { userId, status: 'active' },
    });

    if (activeNumbers >= subscription.plan.maxNumbers) {
      throw new BadRequestException({
        code: 'PLAN_LIMIT_EXCEEDED',
        message: `Plan limit reached (max ${subscription.plan.maxNumbers} numbers)`,
      });
    }

    const baseUrl =
      this.telephonyProvider.constructor.name === 'TwilioProvider'
        ? '' // will be configured
        : '';

    const provisioned = await this.telephonyProvider.provisionNumber(number, {
      baseUrl: baseUrl || 'https://api.voicelink.io',
      provider: this.telephonyProvider.name,
    });

    const phoneNumber = await this.prisma.phoneNumber.create({
      data: {
        userId,
        number: provisioned.number,
        providerSid: provisioned.providerSid,
        provider: this.telephonyProvider.name,
        countryCode: provisioned.countryCode,
        capabilities: provisioned.capabilities,
        monthlyCost: 1.0, // default — updated when known
      },
    });

    // Cache number → user mapping
    await this.redis.setex(
      `number:${provisioned.number}`,
      NUMBER_USER_CACHE_TTL,
      userId,
    );

    return phoneNumber;
  }

  // 4.1.5 — Release a number
  async releaseNumber(userId: string, numberId: string) {
    const number = await this.prisma.phoneNumber.findFirst({
      where: { id: numberId, userId },
    });

    if (!number) {
      throw new NotFoundException({
        code: 'NOT_FOUND',
        message: 'Number not found',
      });
    }

    if (number.status === 'releasing' || number.status === 'released') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Number already released or releasing',
      });
    }

    // Release from provider
    await this.telephonyProvider.releaseNumber(number.providerSid);

    // Set grace period (FR-NUM-08)
    await this.prisma.phoneNumber.update({
      where: { id: numberId },
      data: {
        status: 'releasing',
        releasedAt: new Date(),
      },
    });

    // Remove from Redis cache
    await this.redis.del(`number:${number.number}`);

    return { releasedAt: new Date().toISOString() };
  }

  // 4.1.6 — Lookup user by number (Redis-first, then DB)
  async getUserByNumber(number: string): Promise<string | null> {
    // Try Redis cache first (SDD §9)
    const cached = await this.redis.get(`number:${number}`);
    if (cached) return cached;

    // Fallback to DB
    const phoneNumber = await this.prisma.phoneNumber.findFirst({
      where: { number, status: 'active' },
    });

    if (phoneNumber) {
      // Populate cache
      await this.redis.setex(
        `number:${number}`,
        NUMBER_USER_CACHE_TTL,
        phoneNumber.userId,
      );
      return phoneNumber.userId;
    }

    return null;
  }
}
