import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - windowSeconds;
  
  // Remove old entries and count current
  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zcard(key);
  multi.zadd(key, { score: now, member: `${now}:${Math.random()}` });
  multi.expire(key, windowSeconds);
  
  const results = await multi.exec();
  const count = (results[1] as number) || 0;
  
  const success = count < limit;
  const remaining = Math.max(0, limit - count - 1);
  const reset = now + windowSeconds;
  
  return { success, limit, remaining, reset };
}

// Specific rate limiters
export const loginRateLimit = (ip: string) => 
  rateLimit(`login:${ip}`, 5, 600); // 5 attempts per 10 minutes

export const apiRateLimit = (ip: string) => 
  rateLimit(`api:${ip}`, 60, 60); // 60 requests per minute

export const checkoutRateLimit = (ip: string) => 
  rateLimit(`checkout:${ip}`, 10, 3600); // 10 attempts per hour

export const reviewRateLimit = (userId: string) => 
  rateLimit(`review:${userId}`, 5, 3600); // 5 reviews per hour
