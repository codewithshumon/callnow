import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NumberGracePeriodJob } from './number-grace-period.job';
import { UsageAlertJob } from './usage-alert.job';
import { InvoiceGenerationJob } from './invoice-generation.job';
import { DataRetentionJob } from './data-retention.job';
import { TokenCleanupJob } from './token-cleanup.job';
import { ScheduledMessageJob } from './scheduled-message.job';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [
    NumberGracePeriodJob,
    UsageAlertJob,
    InvoiceGenerationJob,
    DataRetentionJob,
    TokenCleanupJob,
    ScheduledMessageJob,
  ],
})
export class JobsModule {}
