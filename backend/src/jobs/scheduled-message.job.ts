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
        body: { not: null },
      },
      include: {
        conversation: true,
      },
      take: 100,
    });

    for (const msg of pending) {
      if (!msg.conversation) continue;

      try {
        const result = await this.telephonyProvider.sendMessage({
          from: msg.conversation.fromNumber,
          to: msg.conversation.toNumber,
          body: msg.body || '',
          mediaUrls: msg.mediaUrls,
        });

        await this.prisma.message.update({
          where: { id: msg.id },
          data: {
            status: 'sent',
            providerSid: result.providerSid,
          },
        });
      } catch (error: any) {
        this.logger.error(
          `Scheduled message ${msg.id} failed: ${error.message}`,
        );
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
