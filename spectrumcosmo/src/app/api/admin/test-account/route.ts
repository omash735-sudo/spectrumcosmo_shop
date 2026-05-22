import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET – check if test account is enabled
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const sql = getDb();
  const [setting] = await sql`
    SELECT value FROM site_settings WHERE key = 'test_account_enabled'
  `;
  
  const [testUser] = await sql`
    SELECT id, name, email FROM users WHERE is_test_account = true LIMIT 1
  `;

  return NextResponse.json({
    enabled: setting?.value === 'true',
    testUser: testUser || null,
  });
}

// POST – toggle kill switch
export async function POST(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  const { enabled } = await req.json();
  const sql = getDb();

  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('test_account_enabled', ${enabled ? 'true' : 'false'}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;

  return NextResponse.json({ success: true, enabled });
}
