import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { RedisThrottlerStorage } from './common/throttler/redis-throttler-storage.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TelephonyModule } from './telephony/telephony.module';
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
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6379';
        return {
          throttlers: [
            {
              ttl: 60_000,     // 60 seconds
              limit: 100,      // 100 requests per TTL for authenticated users (1.6.3)
            },
          ],
          storage: new RedisThrottlerStorage(new Redis(redisUrl)),
        };
      },
    }),

    // Database — Phase 0.3
    PrismaModule,

    // Telephony Provider Abstraction Layer — Phase 2.5
    TelephonyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
