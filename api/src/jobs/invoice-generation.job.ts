import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * 13.1.3 — Runs 1st of month: generate invoices for previous month.
 */
@Injectable()
export class InvoiceGenerationJob {
  private readonly logger = new Logger(InvoiceGenerationJob.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 2 1 * *') // 2 AM on 1st of each month
  async run() {
    this.logger.log('Generating monthly invoices');
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'active' },
      include: { plan: true },
    });

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    for (const sub of subscriptions) {
      await this.prisma.invoice.create({
        data: {
          userId: sub.userId,
          amount: sub.plan?.monthlyPrice || 0,
          currency: 'USD',
          status: 'open',
          periodStart,
          periodEnd,
        },
      });
    }

    this.logger.log(`Generated ${subscriptions.length} invoices`);
  }
}
