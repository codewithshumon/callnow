import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import type { TelephonyProvider } from '../telephony/interfaces/telephony-provider.interface';
import { TELEPHONY_PROVIDER } from '../telephony/telephony.module';

/**
 * 13.1.6 — Runs every minute: send scheduled messages.
 */
@Injectable()
export class ScheduledMessageJob {
  private readonly logger = new Logger(ScheduledMessageJob.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(TELEPHONY_PROVIDER)
    private readonly telephonyProvider: TelephonyProvider,
  ) {}

  @Cron('*/1 * * * *') // Every minute
  async run() {
    const now = new Date();

    const pending = await this.prisma.message.findMany({
      where: {
        scheduledAt: { lte: now },
        status: 'queued',
        direction: 'outbound',
      },
      take: 100,
    });

    for (const msg of pending) {
      try {
        await this.telephonyProvider.sendMessage({
          from: '', // would be populated from conversation/owned numbers
          to: '',   // would be populated from conversation
          body: msg.body || '',
        });

        await this.prisma.message.update({
          where: { id: msg.id },
          data: { status: 'sent' },
        });
      } catch (error) {
        this.logger.error(`Scheduled message ${msg.id} failed`, error);
        await this.prisma.message.update({
          where: { id: msg.id },
          data: { status: 'failed', errorCode: 'SCHEDULED_SEND_FAILED' },
        });
      }
    }

    if (pending.length > 0) {
      this.logger.log(`Processed ${pending.length} scheduled messages`);
    }
  }
}
