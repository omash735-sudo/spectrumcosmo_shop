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

  const member = `${key}:${now}`;
  const multi = redis.multi();

  // Use a type assertion to bypass strict type checking for zadd.
  // The actual runtime signature of Upstash Redis supports (key, score, member).
  (multi.zadd as any)(key, now, member);
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.expire(key, windowSeconds);

  const results = await multi.exec();
  // results is an array of [error, value] for each command. Index 2 corresponds to zcard.
  const requestCount = (results?.[2]?.[1] as number) || 0;

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
