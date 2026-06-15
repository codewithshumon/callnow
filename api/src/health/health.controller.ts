import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    this.redis = new Redis(
      configService.get<string>('redis.url') || 'redis://localhost:6379',
    );
  }

  @Get()
  @Public()
  async check() {
    let dbStatus = 'disconnected';
    let redisStatus = 'disconnected';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch {}

    try {
      await this.redis.ping();
      redisStatus = 'connected';
    } catch {}

    return {
      status: dbStatus === 'connected' && redisStatus === 'connected' ? 'ok' : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      dialer: 'not-checked', // Go dialer not available in dev
    };
  }
}
