// src/lib/redis.ts
import { Redis } from '@upstash/redis';

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  // During Next.js build (e.g., on Vercel), return a dummy client
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    // Return a fake client with no-op methods
    return {
      get: async () => null,
      set: async () => 'OK',
      incr: async () => 1,
      expire: async () => 1,
      del: async () => 1,
      ttl: async () => 0,
      setex: async () => 'OK',
    } as unknown as Redis;
  }

  if (!redisInstance) {
    redisInstance = Redis.fromEnv();
  }
  return redisInstance;
}
