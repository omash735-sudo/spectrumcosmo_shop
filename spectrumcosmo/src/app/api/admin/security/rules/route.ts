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
    const rules = await sql`
      SELECT * FROM rate_limit_rules
      WHERE expires_at IS NULL OR expires_at > NOW()
      ORDER BY created_at DESC
    `;
    return NextResponse.json(rules);
  } catch (err) {
    console.error('Failed to fetch rules:', err);
    return NextResponse.json([]);
  }
}

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { rule_type, max_requests, window_seconds, action } = await req.json();
    const sql = getDb();
    await sql`
      INSERT INTO rate_limit_rules (rule_type, max_requests, window_seconds, action, created_at)
      VALUES (${rule_type}, ${max_requests}, ${window_seconds}, ${action}, NOW())
    `;
    return NextResponse.json({ success: true });
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
    const sql = getDb();
    await sql`DELETE FROM rate_limit_rules WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to delete rule:', err);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
