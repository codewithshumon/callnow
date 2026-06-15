import { Controller, Post, Req, Logger } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('webhooks/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handleStripeWebhook(@Req() req: Request) {
    const event = req.body as { type: string; data: { object: Record<string, unknown> } };

    this.logger.log(`Stripe webhook: ${event.type}`);

    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(event.data.object);
          break;

        case 'invoice.paid':
          await this.handleInvoicePaid(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          this.logger.log(`Unhandled Stripe event: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${event.type}`, error);
      return { success: true }; // Always return 200 to Stripe
    }
  }

  // 9.2.3 — Checkout completed → activate subscription
  private async handleCheckoutCompleted(obj: Record<string, unknown>) {
    const customerId = obj.customer as string;
    const subscriptionId = obj.subscription as string;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planId: '00000000-0000-0000-0000-000000000002', // Pro default
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      update: {
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    this.logger.log(`Subscription activated for user ${user.id}`);
  }

  // 9.2.4 — Invoice paid
  private async handleInvoicePaid(obj: Record<string, unknown>) {
    const customerId = obj.customer as string;
    const invoiceId = obj.id as string;
    const amount = parseFloat((obj.amount_paid as string) || '0') / 100;

    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.invoice.create({
      data: {
        userId: user.id,
        stripeInvoiceId: invoiceId,
        amount,
        currency: (obj.currency as string) || 'usd',
        status: 'paid',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        paidAt: new Date(),
      },
    });
  }

  // 9.2.5 — Payment failed
  private async handlePaymentFailed(obj: Record<string, unknown>) {
    const customerId = obj.customer as string;
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.subscription.update({
      where: { userId: user.id },
      data: { status: 'past_due' },
    });

    this.logger.warn(`Payment failed for user ${user.id}`);
  }

  // 9.2.6 — Subscription deleted → downgrade to Free
  private async handleSubscriptionDeleted(obj: Record<string, unknown>) {
    const customerId = obj.customer as string;
    const user = await this.prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) return;

    await this.prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: 'canceled',
        planId: '00000000-0000-0000-0000-000000000001', // Free
        canceledAt: new Date(),
      },
    });

    this.logger.log(`Subscription canceled for user ${user.id}`);
  }
}
