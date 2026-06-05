// lib/rate-limit.ts
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
  retryAfterMinutes: number;
}

const redis = Redis.fromEnv();

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  // Use Redis sorted set for sliding window rate limiting
  const member = `${key}:${now}`;
  const multi = redis.multi();
  
  multi.zadd(key, now, member);
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.expire(key, windowSeconds);
  
  const results = await multi.exec();
  const requestCount = results?.[2] as number || 0;
  
  const remaining = Math.max(0, maxRequests - requestCount);
  const success = requestCount <= maxRequests;
  
  const resetAt = new Date((Math.floor(Date.now() / 1000) + windowSeconds) * 1000);
  
  return {
    success,
    limit: maxRequests,
    remaining,
    resetAt,
    retryAfterSeconds: success ? 0 : windowSeconds,
    retryAfterMinutes: success ? 0 : Math.ceil(windowSeconds / 60),
  };
}
