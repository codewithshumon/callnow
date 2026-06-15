import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 13.1.2 — Runs daily: check users approaching plan limits.
 */
@Injectable()
export class UsageAlertJob {
  private readonly logger = new Logger(UsageAlertJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 9 * * *') // 9 AM daily
  async run() {
    this.logger.log('Running usage alert check');
    const subscriptions = await this.prisma.subscription.findMany({
      include: { plan: true, user: { select: { email: true } } },
    });

    for (const sub of subscriptions) {
      if (!sub.plan) continue;

      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const usage = await this.prisma.usageRecord.findUnique({
        where: { userId_periodStart: { userId: sub.userId, periodStart } },
      });
      if (!usage) continue;

      const smsPct = sub.plan.includedSms > 0
        ? (usage.smsSent / sub.plan.includedSms) * 100 : 0;
      const minPct = sub.plan.includedMinutes > 0
        ? (usage.minutesUsed / sub.plan.includedMinutes) * 100 : 0;

      if (smsPct >= 80 || minPct >= 80) {
        this.logger.log(
          `Usage alert: ${sub.user.email} — SMS ${smsPct.toFixed(1)}%, Minutes ${minPct.toFixed(1)}%`,
        );
        // SendGrid email would be dispatched here
      }
    }
  }
}
