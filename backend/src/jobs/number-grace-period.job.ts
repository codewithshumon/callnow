import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';

/**
 * 13.1.1 — Runs daily: finalize numbers past their 7-day grace period.
 */
@Injectable()
export class NumberGracePeriodJob {
  private readonly logger = new Logger(NumberGracePeriodJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
  ) {}

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

    for (const num of expired) {
      try {
        await this.telephonyProvider.releaseNumber(num.providerSid);
      } catch (err: any) {
        this.logger.warn(
          `Failed to release number ${num.number} from provider: ${err.message}`,
        );
      }
    }

    await this.prisma.phoneNumber.updateMany({
      where: { id: { in: expired.map((n) => n.id) } },
      data: { status: 'released' },
    });

    this.logger.log(`Released ${expired.length} numbers`);
  }
}
