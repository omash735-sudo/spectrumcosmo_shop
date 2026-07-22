// src/lib/redis.ts
import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return {
      get: async () => null,
      set: async () => 'OK',
      incr: async () => 1,
      expire: async () => 1,
      del: async () => 1,
      ttl: async () => 0,
      setex: async () => 'OK',
      multi: () => ({
        zadd: () => {},
        zremrangebyscore: () => {},
        zcard: () => {},
        expire: () => {},
        exec: async () => [[null, 0]],
      }),
    } as unknown as Redis;
  }
  if (!redisInstance) {
    redisInstance = Redis.fromEnv();
  }
  return redisInstance;
}
