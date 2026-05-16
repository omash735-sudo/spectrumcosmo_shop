import { getDb } from './db';

interface Rule {
  id: number;
  rule_key: string;
  rule_name: string;
  is_enabled: boolean;
  config: any;
}

// Cache for rules (refresh every 60 seconds)
let rulesCache: Map<string, Rule> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL = 60000; // 60 seconds

async function loadRules(): Promise<Map<string, Rule>> {
  const now = Date.now();
  if (rulesCache.size > 0 && now - lastCacheRefresh < CACHE_TTL) {
    return rulesCache;
  }
  
  try {
    const sql = getDb();
    const rules = await sql`SELECT * FROM protection_rules`;
    
    rulesCache.clear();
    for (const rule of rules) {
      rulesCache.set(rule.rule_key, rule);
    }
    lastCacheRefresh = now;
  } catch (err) {
    console.error('Failed to load rules:', err);
  }
  
  return rulesCache;
}

export async function getRule(ruleKey: string): Promise<Rule | null> {
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
  // Refresh cache
  rulesCache.delete(ruleKey);
  lastCacheRefresh = 0;
}

export async function getAllRules(): Promise<Rule[]> {
  const rules = await loadRules();
  return Array.from(rules.values());
}
