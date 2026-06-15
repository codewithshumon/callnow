import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { UsageTrackerService } from './usage-tracker.service';
import { StripeWebhookController } from './webhooks/stripe-webhook.controller';

@Module({
  controllers: [BillingController, StripeWebhookController],
  providers: [BillingService, UsageTrackerService],
  exports: [BillingService, UsageTrackerService],
})
export class BillingModule {}
