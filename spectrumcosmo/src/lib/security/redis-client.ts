// lib/security/redis-client.ts
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Redis configuration missing');
    }
    redisClient = Redis.fromEnv();
  }
  return redisClient;
}

export async function isRateLimited(key: string, maxRequests: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedisClient();
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return current > maxRequests;
}

export async function isIpBlocked(ip: string): Promise<boolean> {
  const redis = getRedisClient();
  const blocked = await redis.get(`blocked:${ip}`);
  return blocked !== null;
}

export async function blockIp(ip: string, durationSeconds: number): Promise<void> {
  const redis = getRedisClient();
  await redis.setex(`blocked:${ip}`, durationSeconds, 'blocked');
}
