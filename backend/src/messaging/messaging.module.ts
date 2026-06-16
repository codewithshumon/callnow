import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MessagingController } from './messaging.controller';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { SmsWebhookController } from './webhooks/sms-webhook.controller';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [MessagingController, SmsWebhookController],
  providers: [MessagingService, MessagingGateway],
  exports: [MessagingService],
})
export class MessagingModule {}
