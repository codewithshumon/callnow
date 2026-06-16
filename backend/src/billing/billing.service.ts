import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  // 9.1.2 — Get current usage vs plan limits
  async getCurrentUsage(userId: string) {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    let usage = await this.prisma.usageRecord.findUnique({
      where: { userId_periodStart: { userId, periodStart } },
    });

    if (!usage) {
      usage = await this.prisma.usageRecord.create({
        data: { userId, periodStart, periodEnd },
      });
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    const plan = subscription?.plan;

    return {
      plan: plan?.name || 'Free',
      period: {
        start: periodStart.toISOString().split('T')[0],
        end: periodEnd.toISOString().split('T')[0],
      },
      usage: {
        minutesUsed: usage.minutesUsed,
        minutesIncluded: plan?.includedMinutes || 100,
        smsUsed: usage.smsSent,
        smsIncluded: plan?.includedSms || 50,
        mmsUsed: usage.mmsSent,
        mmsIncluded: plan?.includedMms || 0,
        numbersHeld: usage.numbersHeld,
        numbersAllowed: plan?.maxNumbers || 1,
      },
    };
  }

  // 9.1.3 — Get invoices
  async getInvoices(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 9.1.4 — Create Stripe Checkout session
  async createCheckoutSession(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException({ code: 'NOT_FOUND', message: 'Plan not found' });

    // In production, this would call Stripe API:
    // const session = await stripe.checkout.sessions.create({...})
    // For now, return a simulated session URL
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    this.logger.log(`Checkout session for ${user?.email} → ${plan.name}`);

    return { checkoutUrl: `https://checkout.voicelink.io/${plan.name.toLowerCase()}` };
  }

  // 9.1.5 — Upgrade/downgrade plan
  async upgradePlan(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException({ code: 'NOT_FOUND', message: 'Plan not found' });

    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        planId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`User ${userId} upgraded to ${plan.name}`);
    return { message: `Upgraded to ${plan.name}` };
  }

  // 9.1.6 — Get invoice PDF
  async getInvoicePdf(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, userId },
    });
    if (!invoice) throw new Error('Invoice not found');
    return { pdfUrl: invoice.pdfUrl };
  }
}
