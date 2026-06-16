import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 13.1.1 — Runs daily: finalize numbers past their 7-day grace period.
 */
@Injectable()
export class NumberGracePeriodJob {
  private readonly logger = new Logger(NumberGracePeriodJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 3 * * *') // 3 AM daily
  async run() {
    this.logger.log('Running number grace period cleanup');
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const expired = await this.prisma.phoneNumber.findMany({
      where: {
        status: 'releasing',
        releasedAt: { lte: cutoff },
      },
    });

    if (expired.length === 0) return;

    // In production: call telephonyProvider.releaseNumber() per number
    await this.prisma.phoneNumber.updateMany({
      where: { id: { in: expired.map((n) => n.id) } },
      data: { status: 'released' },
    });

    this.logger.log(`Released ${expired.length} numbers`);
  }
}
