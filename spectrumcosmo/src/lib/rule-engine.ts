// lib/security-rules.ts
import { getDb, queryMany } from './db';

export interface ProtectionRule {
  id: number;
  rule_key: string;
  rule_name: string;
  description: string;
  category: string;
  is_enabled: boolean;
  is_system_rule: boolean;
  config: any;
  updated_at: Date;
}

export interface RateLimitOverride {
  id: number;
  rule_type: string;
  identifier: string;
  max_requests: number;
  window_seconds: number;
  action: string;
  reason: string;
  expires_at: Date | null;
}

// Cache for rules
let rulesCache: Map<string, ProtectionRule> = new Map();
let overridesCache: Map<string, RateLimitOverride> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL = 60000; // 60 seconds

async function loadRules(): Promise<Map<string, ProtectionRule>> {
  const now = Date.now();
  if (rulesCache.size > 0 && now - lastCacheRefresh < CACHE_TTL) {
    return rulesCache;
  }
  
  try {
    const sql = getDb();
    // Use queryMany to get typed array
    const rules = await queryMany<ProtectionRule>`SELECT * FROM protection_rules`;
    
    rulesCache.clear();
    for (const rule of rules) {
      rulesCache.set(rule.rule_key, rule);
    }
    
    const overrides = await queryMany<RateLimitOverride>`
      SELECT * FROM rate_limit_overrides WHERE expires_at IS NULL OR expires_at > NOW()
    `;
    overridesCache.clear();
    for (const override of overrides) {
      const key = `${override.rule_type}:${override.identifier}`;
      overridesCache.set(key, override);
    }
    
    lastCacheRefresh = now;
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
  
  return rulesCache;
}

export async function getRule(ruleKey: string): Promise<ProtectionRule | null> {
  const rules = await loadRules();
  return rules.get(ruleKey) || null;
}

export async function isRuleEnabled(ruleKey: string): Promise<boolean> {
  const rule = await getRule(ruleKey);
  return rule?.is_enabled || false;
}

export async function getRuleConfig(ruleKey: string): Promise<any> {
  const rule = await getRule(ruleKey);
  return rule?.config || {};
}

export async function getRateLimitOverride(ruleType: string, identifier: string): Promise<RateLimitOverride | null> {
  await loadRules();
  const key = `${ruleType}:${identifier}`;
  return overridesCache.get(key) || null;
}

export async function updateRuleConfig(ruleKey: string, config: any): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE protection_rules 
    SET config = ${JSON.stringify(config)}, updated_at = NOW()
    WHERE rule_key = ${ruleKey}
  `;
  // Refresh cache
  rulesCache.delete(ruleKey);
  lastCacheRefresh = 0;
}

export async function toggleRule(ruleKey: string, enabled: boolean): Promise<void> {
  const sql = getDb();
  await sql`
    UPDATE protection_rules 
    SET is_enabled = ${enabled}, updated_at = NOW()
    WHERE rule_key = ${ruleKey}
  `;
  rulesCache.delete(ruleKey);
  lastCacheRefresh = 0;
}

export async function getAllRules(): Promise<ProtectionRule[]> {
  const rules = await loadRules();
  return Array.from(rules.values());
}

export async function getRulesByCategory(category: string): Promise<ProtectionRule[]> {
  const rules = await loadRules();
  return Array.from(rules.values()).filter(r => r.category === category);
}

export async function addRateLimitOverride(
  ruleType: string,
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
  action: string,
  reason?: string,
  expiresAt?: Date
): Promise<void> {
  const sql = getDb();
  await sql`
    INSERT INTO rate_limit_overrides (rule_type, identifier, max_requests, window_seconds, action, reason, expires_at, created_at)
    VALUES (${ruleType}, ${identifier}, ${maxRequests}, ${windowSeconds}, ${action}, ${reason || null}, ${expiresAt || null}, NOW())
    ON CONFLICT (rule_type, identifier) DO UPDATE SET
      max_requests = ${maxRequests},
      window_seconds = ${windowSeconds},
      action = ${action},
      reason = ${reason || null},
      expires_at = ${expiresAt || null}
  `;
  lastCacheRefresh = 0;
}

export async function removeRateLimitOverride(ruleType: string, identifier: string): Promise<void> {
  const sql = getDb();
  await sql`
    DELETE FROM rate_limit_overrides WHERE rule_type = ${ruleType} AND identifier = ${identifier}
  `;
  lastCacheRefresh = 0;
}

export async function getAllRateLimitOverrides(): Promise<RateLimitOverride[]> {
  await loadRules();
  return Array.from(overridesCache.values());
}

export async function isIPWhitelisted(ip: string): Promise<boolean> {
  const rule = await getRule('ip_whitelist');
  if (!rule?.is_enabled) return false;
  const whitelist = rule.config?.ips || [];
  return whitelist.includes(ip);
}

export async function isIPBlacklisted(ip: string): Promise<boolean> {
  const rule = await getRule('ip_blacklist');
  if (!rule?.is_enabled) return false;
  const blacklist = rule.config?.ips || [];
  return blacklist.includes(ip);
}

export async function addIPToWhitelist(ip: string): Promise<void> {
  const rule = await getRule('ip_whitelist');
  const currentIps = rule?.config?.ips || [];
  if (!currentIps.includes(ip)) {
    currentIps.push(ip);
    await updateRuleConfig('ip_whitelist', { ips: currentIps });
  }
}

export async function addIPToBlacklist(ip: string): Promise<void> {
  const rule = await getRule('ip_blacklist');
  const currentIps = rule?.config?.ips || [];
  if (!currentIps.includes(ip)) {
    currentIps.push(ip);
    await updateRuleConfig('ip_blacklist', { ips: currentIps });
  }
}

export async function removeIPFromWhitelist(ip: string): Promise<void> {
  const rule = await getRule('ip_whitelist');
  const currentIps = rule?.config?.ips || [];
  const updatedIps = currentIps.filter((i: string) => i !== ip);
  await updateRuleConfig('ip_whitelist', { ips: updatedIps });
}

export async function removeIPFromBlacklist(ip: string): Promise<void> {
  const rule = await getRule('ip_blacklist');
  const currentIps = rule?.config?.ips || [];
  const updatedIps = currentIps.filter((i: string) => i !== ip);
  await updateRuleConfig('ip_blacklist', { ips: updatedIps });
}
