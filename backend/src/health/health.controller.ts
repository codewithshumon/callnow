import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { Public } from '../common/decorators/public.decorator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

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

    let dialerStatus = 'not-checked';
    try {
      const dialerUrl =
        process.env.DIALER_SERVICE_URL || 'http://localhost:8080';
      const resp = await fetch(`${dialerUrl}/health`);
      dialerStatus = resp.ok ? 'connected' : 'disconnected';
    } catch {
      dialerStatus = 'disconnected';
    }

    return {
      status:
        dbStatus === 'connected' && redisStatus === 'connected'
          ? 'ok'
          : 'degraded',
      db: dbStatus,
      redis: redisStatus,
      dialer: dialerStatus,
    };
  }
}
