// app/api/admin/protection-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryAsArray } from '@/lib/db';
import { getVerifiedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settings = await req.json();
    const sql = getDb();
    
    await sql`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES ('security_settings', ${JSON.stringify(settings)}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(settings)}, updated_at = NOW()
    `;
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to save protection settings:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { user, error } = await getVerifiedUser(req);
  if (error || !user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const settingsArray = await queryAsArray<{ value: any }>`
      SELECT value FROM system_settings WHERE key = 'security_settings'
    `;
    
    const defaultSettings = {
      maxFailedAttempts: 10,
      blockDurationMinutes: 30,
      rateLimitPerMinute: 60,
      enableCaptchaAfterAttempts: 5,
      autoBlockEnabled: true,
    };
    
    if (settingsArray.length === 0) {
      return NextResponse.json(defaultSettings);
    }
    
    const savedSettings = settingsArray[0].value;
    return NextResponse.json({ ...defaultSettings, ...savedSettings });
  } catch (err) {
    console.error('Failed to fetch protection settings:', err);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}
