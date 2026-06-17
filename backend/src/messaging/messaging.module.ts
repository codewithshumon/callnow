import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthModule } from '../auth/auth.module';
import { NumbersModule } from '../numbers/numbers.module';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { SmsWebhookController } from './webhooks/sms-webhook.controller';

@Module({
  imports: [EventEmitterModule.forRoot(), AuthModule, NumbersModule],
  controllers: [MessagingController, SmsWebhookController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
