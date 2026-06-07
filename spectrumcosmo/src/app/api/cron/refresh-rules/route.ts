// app/api/admin/refresh-rules/route.ts
import { NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const dynamic = 'force-dynamic';

interface ProtectionRule {
  rule_key: string;
  is_enabled: boolean;
  config: any;
}

export async function GET() {
  try {
    const sql = getDb();

    const rules = await queryAsArray<ProtectionRule>`
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

    await redis.setex('security:rules', 3600, rulesMap);

    console.log(`Refreshed ${rules.length} protection rules in Redis`);

    return NextResponse.json({ success: true, count: rules.length });
  } catch (err) {
    console.error('Failed to refresh rules:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
