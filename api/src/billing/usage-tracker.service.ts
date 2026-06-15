import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 9.4.2 — Increment SMS counter
  async incrementSmsSent(userId: string) {
    await this.increment(userId, 'smsSent');
  }

  async incrementSmsReceived(userId: string) {
    await this.increment(userId, 'smsReceived');
  }

  async incrementMinutes(userId: string, minutes: number) {
    const record = await this.getOrCreateRecord(userId);
    await this.prisma.usageRecord.update({
      where: { id: record.id },
      data: { minutesUsed: { increment: minutes } },
    });
    await this.checkLimits(userId);
  }

  async incrementNumbersHeld(userId: string) {
    await this.increment(userId, 'numbersHeld');
  }

  // 9.4.3 — Check plan limits before operation
  async checkLimits(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });
    if (!subscription?.plan) return;

    const usage = await this.getOrCreateRecord(userId);
    const plan = subscription.plan;

    // Check limits
    if (usage.smsSent >= plan.includedSms && plan.includedSms > 0) {
      // Alert at 100%
      this.logger.warn(`User ${userId} reached SMS limit`);
    }
    if (usage.minutesUsed >= plan.includedMinutes * 0.8 && plan.includedMinutes > 0) {
      // Alert at 80%
      this.logger.warn(
        `User ${userId} at 80% minute usage (${usage.minutesUsed}/${plan.includedMinutes})`,
      );
    }
  }

  // 9.4.5 — Daily cron: check all users approaching limit
  async dailyAlertCheck() {
    const subscriptions = await this.prisma.subscription.findMany({
      include: { plan: true, user: { select: { email: true } } },
    });

    for (const sub of subscriptions) {
      if (!sub.plan) continue;
      const usage = await this.getOrCreateRecord(sub.userId);

      const smsPct = sub.plan.includedSms > 0
        ? (usage.smsSent / sub.plan.includedSms) * 100
        : 0;
      const minPct = sub.plan.includedMinutes > 0
        ? (usage.minutesUsed / sub.plan.includedMinutes) * 100
        : 0;

      if (smsPct >= 80 || minPct >= 80) {
        this.logger.log(
          `Usage alert for ${sub.user.email}: SMS ${smsPct.toFixed(1)}%, Minutes ${minPct.toFixed(1)}%`,
        );
        // SendGrid email would be sent here in production
      }
    }
  }

  private async increment(userId: string, field: string) {
    const record = await this.getOrCreateRecord(userId);
    await this.prisma.usageRecord.update({
      where: { id: record.id },
      data: { [field]: { increment: 1 } },
    });
    await this.checkLimits(userId);
  }

  private async getOrCreateRecord(userId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let record = await this.prisma.usageRecord.findUnique({
      where: { userId_periodStart: { userId, periodStart } },
    });

    if (!record) {
      record = await this.prisma.usageRecord.create({
        data: { userId, periodStart, periodEnd },
      });
    }

    return record;
  }
}
