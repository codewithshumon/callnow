import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { APP_GUARD } from '@nestjs/core';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler-storage.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TelephonyModule } from './telephony/telephony.module';
import { AuthModule } from './auth/auth.module';
import { NumbersModule } from './numbers/numbers.module';
import { MessagingModule } from './messaging/messaging.module';
import { CallingModule } from './calling/calling.module';
import { ContactsModule } from './contacts/contacts.module';
import { DialerModule } from './dialer/dialer.module';
import { BillingModule } from './billing/billing.module';
import { TemplatesModule } from './templates/templates.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AuditModule } from './audit/audit.module';
import { JobsModule } from './jobs/jobs.module';
import { HealthModule } from './health/health.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import databaseConfig from './config/database.config';
import redisConfig from './config/redis.config';
import telephonyConfig from './config/telephony.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import Redis from 'ioredis';

@Module({
  imports: [
    // Global configuration — Phase 0.2
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, redisConfig, telephonyConfig, jwtConfig, appConfig],
    }),

    // Rate limiting — Phase 1.6
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6381';
        return {
          throttlers: [{ ttl: 60_000, limit: 100 }],
          storage: new RedisThrottlerStorage(new Redis(redisUrl)),
        };
      },
    }),

    // Redis-backed queues — Phase 14 (BullMQ)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url') || 'redis://localhost:6381',
        },
      }),
    }),

    // Scheduled jobs — Phase 13
    JobsModule,

    // Database — Phase 0.3
    PrismaModule,

    // Telephony PAL — Phase 2
    TelephonyModule,

    // Auth — Phase 3
    AuthModule,

    // Numbers — Phase 4
    NumbersModule,

    // Messaging — Phase 5
    MessagingModule,

    // Calling — Phase 6
    CallingModule,

    // Contacts — Phase 7
    ContactsModule,

    // Dialer — Phase 8 (proxy to Go)
    DialerModule,

    // Billing — Phase 9
    BillingModule,

    // Templates — Phase 10
    TemplatesModule,

    // API Keys — Phase 11
    ApiKeysModule,

    // Audit — Phase 12
    AuditModule,

    // Health — Phase 16
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
