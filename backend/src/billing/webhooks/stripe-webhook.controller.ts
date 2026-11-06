import {
  Controller,
  Post,
  Req,
  Headers,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

type StripeClient = any;

type StripeEvent = any;

import { ConfigService } from '@nestjs/config';
import { Public } from '../../common/decorators/public.decorator';

@Controller('webhooks/stripe')
@Public()
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);
  private readonly stripe: StripeClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const StripeSdk = require('stripe');
    const apiKey =
      configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_dummy_key_for_testing';
    this.stripe = new StripeSdk(apiKey);
  }

  @Post()
  async handleStripeWebhook(
    @Req() req: Request,
    @Headers('stripe-signature') sig: string,
  ) {
    const rawReq = req as RawBodyRequest<Request>;
    // 9.2.2 — Stripe signature verification
    const webhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
    let event: StripeEvent;

    const isProd = process.env.NODE_ENV === 'production';
    if (!webhookSecret || !sig) {
      if (isProd) {
        throw new BadRequestException({
          code: 'FORBIDDEN',
          message: 'Webhook secret or signature missing',
        });
      }
      // Dev mode: trust body directly only in non-production
      this.logger.warn('Processing Stripe webhook in dev without signature verification');
      event = req.body;
    } else {
      try {
        event = this.stripe.webhooks.constructEvent(
          rawReq.rawBody || Buffer.from(JSON.stringify(req.body ?? {})),
          sig,
          webhookSecret,
        );
      } catch (err) {
        this.logger.error('Stripe signature verification failed', err);
        throw new BadRequestException({
          code: 'FORBIDDEN',
          message: 'Invalid webhook signature',
        });
      }
    }

    this.logger.log(`Stripe webhook: ${event.type}`);

    try {
      const obj = event.data.object as Record<string, unknown>;
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(obj);
          break;
        case 'invoice.paid':
          await this.handleInvoicePaid(obj);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(obj);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(obj);
          break;
        default:
          this.logger.log(`Unhandled Stripe event: ${event.type}`);
      }
      return { success: true };
    } catch (error) {
      this.logger.error(`Stripe webhook error: ${event.type}`, error);
      return { success: true }; // Always 200 to Stripe
    }
  }

  // 9.2.3 — Checkout completed
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
        planId: '00000000-0000-0000-0000-000000000002',
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

  // 9.2.6 — Subscription deleted
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
        planId: '00000000-0000-0000-0000-000000000001',
        canceledAt: new Date(),
      },
    });
    this.logger.log(`Subscription canceled for user ${user.id}`);
  }
}
