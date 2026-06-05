// lib/security/rules.ts
import { getRedisClient } from './redis-client';
import type { SecurityRules } from './types';

const CACHE_KEY = 'security:rules';
const CACHE_TTL = 300;

const DEFAULT_RULES: SecurityRules = {
  rate_limiting: { enabled: true, max_requests: 60, window_seconds: 60 },
  suspicious_activity: { enabled: true, max_requests: 20, window_seconds: 10, block_minutes: 30 },
  checkout_protection: { enabled: true, max_attempts: 10, window_hours: 1 },
  bot_detection: { enabled: true },
  auto_block: { enabled: true, risk_threshold: 80, block_minutes: 30 },
  admin_protection: { enabled: true },
};

export async function getSecurityRules(): Promise<SecurityRules> {
  try {
    const redis = getRedisClient();
    const cached = await redis.get(CACHE_KEY);
    if (cached && typeof cached === 'object') {
      return { ...DEFAULT_RULES, ...cached as Partial<SecurityRules> };
    }
    return DEFAULT_RULES;
  } catch {
    return DEFAULT_RULES;
  }
}

export async function getRule<T extends keyof SecurityRules>(ruleName: T): Promise<SecurityRules[T]> {
  const rules = await getSecurityRules();
  return rules[ruleName];
}
