import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import Redis from 'ioredis';

/**
 * Redis-backed storage for @nestjs/throttler.
 *
 * Stores throttle hit counts in Redis with TTL-based expiry.
 * This allows rate-limit state to persist across horizontal API replicas.
 *
 * Ref: FR-AUTH-07 (login rate limiting), backend-tasks.md §1.6.1
 */
@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    _limit: number,
    _blockDuration: number,
    _throttlerName: string,
  ): Promise<{ isBlocked: boolean; timeToExpire: number; timeToBlockExpire: number; totalHits: number }> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.pttl(key);

    const results = await multi.exec();
    if (!results) {
      return { isBlocked: false, timeToExpire: ttl, timeToBlockExpire: 0, totalHits: 1 };
    }

    const totalHits = (results[0]?.[1] as number) ?? 1;
    const currentTtl = (results[1]?.[1] as number) ?? -1;

    // Set TTL on first hit or if key has no expiry
    if (totalHits === 1 || currentTtl === -1) {
      await this.redis.pexpire(key, ttl);
    }

    const effectiveTtl = currentTtl > 0 ? currentTtl : ttl;

    return {
      isBlocked: false, // Blocking is handled by the guard itself
      timeToExpire: effectiveTtl,
      timeToBlockExpire: 0,
      totalHits,
    };
  }
}
