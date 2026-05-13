import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const sql = getDb();
    const rows = await sql`SELECT setting_key, setting_value FROM system_settings`;
    const settings = Object.fromEntries(rows.map((r: any) => [r.setting_key, r.setting_value]));
    return NextResponse.json(settings);
  } catch (err: any) {
    console.error('Settings fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const updates = await req.json();
    const sql = getDb();

    for (const [key, value] of Object.entries(updates)) {
      await sql`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
      `;
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Optional: PATCH for partial updates (if you prefer PATCH over PUT)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const updates = await req.json();
    const sql = getDb();

    for (const [key, value] of Object.entries(updates)) {
      await sql`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
      `;
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Settings update error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
