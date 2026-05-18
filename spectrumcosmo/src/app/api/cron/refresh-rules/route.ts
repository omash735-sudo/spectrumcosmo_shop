import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDb();
    
    // Fetch all active protection rules from database
    const rules = await sql`
      SELECT rule_key, is_enabled, config 
      FROM protection_rules 
      WHERE is_enabled = true
    `;
    
    const rulesMap: Record<string, any> = {};
    for (const rule of rules) {
      rulesMap[rule.rule_key] = {
        enabled: rule.is_enabled,
        ...rule.config,
      };
    }
    
    // Store in Redis with 1 hour expiration (will be refreshed by cron)
    await redis.setex('security:rules', 3600, rulesMap);
    
    console.log(`Refreshed ${rules.length} protection rules in Redis`);
    
    return NextResponse.json({ success: true, count: rules.length });
  } catch (err) {
    console.error('Failed to refresh rules:', err);
    return NextResponse.json({ error: 'Failed to refresh rules' }, { status: 500 });
  }
}
