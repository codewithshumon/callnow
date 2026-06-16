import { Module } from '@nestjs/common';
import { CallingController } from './calling.controller';
import { CallingService } from './calling.service';
import { CallingGateway } from './calling.gateway';
import { VoiceWebhookController } from './webhooks/voice-webhook.controller';

@Module({
  controllers: [CallingController, VoiceWebhookController],
  providers: [CallingService, CallingGateway],
  exports: [CallingService],
})
export class CallingModule {}
