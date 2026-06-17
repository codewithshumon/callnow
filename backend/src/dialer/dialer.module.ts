import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DialerController } from './dialer.controller';
import { DialerService } from './dialer.service';
import { DialerGateway } from './dialer.gateway';
import { DialerCallbackController } from './internal/dialer-callback.controller';
import { CsvValidator } from './csv-validator';

@Module({
  imports: [AuthModule],
  controllers: [DialerController, DialerCallbackController],
  providers: [DialerService, DialerGateway, CsvValidator],
  exports: [DialerService],
})
export class DialerModule {}
