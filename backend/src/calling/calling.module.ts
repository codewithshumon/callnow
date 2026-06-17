import { Module } from '@nestjs/common';
import { CallingController } from './calling.controller';
import { CallingService } from './calling.service';
import { CallingGateway } from './calling.gateway';
// VoiceWebhookController stub — file not yet created

@Module({
  controllers: [CallingController],
  providers: [CallingService, CallingGateway],
  exports: [CallingService],
})
export class CallingModule {}
