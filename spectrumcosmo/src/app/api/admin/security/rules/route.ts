import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';
import { getAllRules, updateRuleConfig, toggleRule } from '@/lib/rule-engine';

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const type = searchParams.get('type');

  try {
    const sql = getDb();
    
    // If type is 'overrides', return rate_limit_rules
    if (type === 'overrides') {
      const overrides = await sql`
        SELECT * FROM rate_limit_rules
        WHERE expires_at IS NULL OR expires_at > NOW()
        ORDER BY created_at DESC
      `;
      return NextResponse.json(overrides);
    }
    
    // If type is 'security', return protection_rules
    if (type === 'security') {
      const securityRules = await getAllRules();
      return NextResponse.json(securityRules);
    }
    
    // Default: return both
    const [overrides, securityRules] = await Promise.all([
      sql`
        SELECT * FROM rate_limit_rules
        WHERE expires_at IS NULL OR expires_at > NOW()
        ORDER BY created_at DESC
      `,
      getAllRules(),
    ]);
    
    return NextResponse.json({ overrides, securityRules });
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
    const { type, rule_type, max_requests, window_seconds, action, ruleKey, config, enabled } = await req.json();
    const sql = getDb();
    
    // Handle rate limit override
    if (type === 'override' || (rule_type && max_requests)) {
      await sql`
        INSERT INTO rate_limit_rules (rule_type, max_requests, window_seconds, action, created_at)
        VALUES (${rule_type}, ${max_requests}, ${window_seconds}, ${action}, NOW())
      `;
      return NextResponse.json({ success: true });
    }
    
    // Handle security rule toggle
    if (ruleKey && enabled !== undefined) {
      await toggleRule(ruleKey, enabled);
      return NextResponse.json({ success: true });
    }
    
    // Handle security rule config update
    if (ruleKey && config) {
      await updateRuleConfig(ruleKey, config);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (err) {
    console.error('Failed to add rule:', err);
    return NextResponse.json({ error: 'Failed to add rule' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const type = url.searchParams.get('type');
    const sql = getDb();
    
    if (type === 'override' && id) {
      await sql`DELETE FROM rate_limit_rules WHERE id = ${id}`;
    } else if (id) {
      await sql`DELETE FROM rate_limit_rules WHERE id = ${id}`;
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete rule:', err);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
