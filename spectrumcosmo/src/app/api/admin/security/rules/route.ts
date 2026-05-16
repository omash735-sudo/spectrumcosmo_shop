import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sql = getDb();
    
    // Check if protection_rules table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'protection_rules'
      ) as exists
    `;
    
    // If table doesn't exist, return default rules
    if (!tableCheck[0]?.exists) {
      return NextResponse.json([
        {
          id: 1,
          rule_key: 'login_protection',
          rule_name: 'Login Protection',
          description: 'Blocks IP after multiple failed login attempts',
          is_enabled: true,
          config: { max_attempts: 5, window_minutes: 10, block_minutes: 15 }
        },
        {
          id: 2,
          rule_key: 'rate_limiting',
          rule_name: 'Rate Limiting',
          description: 'Limits requests per IP per minute',
          is_enabled: true,
          config: { max_requests: 60, window_seconds: 60 }
        },
        {
          id: 3,
          rule_key: 'suspicious_activity',
          rule_name: 'Suspicious Activity',
          description: 'Detects bot-like rapid requests',
          is_enabled: true,
          config: { max_requests: 20, window_seconds: 10, block_minutes: 30 }
        },
        {
          id: 4,
          rule_key: 'checkout_protection',
          rule_name: 'Checkout Protection',
          description: 'Limits checkout attempts per IP',
          is_enabled: true,
          config: { max_attempts: 10, window_hours: 1 }
        },
        {
          id: 5,
          rule_key: 'bot_detection',
          rule_name: 'Bot Detection',
          description: 'Detects and blocks bot user agents',
          is_enabled: true,
          config: { block_bots: true, log_only: false }
        },
        {
          id: 6,
          rule_key: 'auto_block',
          rule_name: 'Auto-Block',
          description: 'Auto-blocks IPs with high risk score',
          is_enabled: true,
          config: { risk_threshold: 80, block_minutes: 30 }
        },
        {
          id: 7,
          rule_key: 'captcha_trigger',
          rule_name: 'CAPTCHA Trigger',
          description: 'Shows CAPTCHA after failed attempts',
          is_enabled: true,
          config: { failed_attempts_threshold: 3 }
        },
        {
          id: 8,
          rule_key: 'admin_protection',
          rule_name: 'Admin Protection',
          description: 'Protects admin routes from unauthorized access',
          is_enabled: true,
          config: { enabled: true }
        }
      ]);
    }
    
    const rules = await sql`SELECT * FROM protection_rules ORDER BY id`;
    return NextResponse.json(rules);
  } catch (err) {
    console.error('Failed to fetch rules:', err);
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { ruleKey, enabled, config } = body;
    const sql = getDb();
    
    if (enabled !== undefined) {
      // Toggle rule
      await sql`
        UPDATE protection_rules 
        SET is_enabled = ${enabled}, updated_at = NOW()
        WHERE rule_key = ${ruleKey}
      `;
    } else if (config) {
      // Update rule config
      await sql`
        UPDATE protection_rules 
        SET config = ${JSON.stringify(config)}, updated_at = NOW()
        WHERE rule_key = ${ruleKey}
      `;
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update rule:', err);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}
