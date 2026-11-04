import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly redisUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.redisUrl =
      this.configService.get<string>('redis.url') || 'redis://localhost:6383';
  }

  getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(this.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy(times) {
          return Math.min(times * 100, 3000);
        },
      });
      this.client.on('error', (err) => {
        this.logger.warn(`Redis connection error: ${err.message}`);
      });
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.getClient().get(key);
    } catch (err: any) {
      this.logger.warn(`Redis get failed for key ${key}: ${err.message}`);
      return null;
    }
  }

  async set(key: string, value: string): Promise<'OK' | null> {
    try {
      return await this.getClient().set(key, value);
    } catch (err: any) {
      this.logger.warn(`Redis set failed for key ${key}: ${err.message}`);
      return null;
    }
  }

  async setex(
    key: string,
    seconds: number,
    value: string,
  ): Promise<'OK' | null> {
    try {
      return await this.getClient().setex(key, seconds, value);
    } catch (err: any) {
      this.logger.warn(`Redis setex failed for key ${key}: ${err.message}`);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.getClient().del(key);
    } catch (err: any) {
      this.logger.warn(`Redis del failed for key ${key}: ${err.message}`);
      return 0;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.getClient().incr(key);
    } catch (err: any) {
      this.logger.warn(`Redis incr failed for key ${key}: ${err.message}`);
      return 0;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.getClient().expire(key, seconds);
    } catch (err: any) {
      this.logger.warn(`Redis expire failed for key ${key}: ${err.message}`);
      return 0;
    }
  }

  async ping(): Promise<string> {
    try {
      return await this.getClient().ping();
    } catch (err: any) {
      this.logger.warn(`Redis ping failed: ${err.message}`);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
      this.client = null;
    }
  }
}
