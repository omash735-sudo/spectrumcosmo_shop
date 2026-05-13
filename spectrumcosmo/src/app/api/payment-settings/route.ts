import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// GET – fetch current payment settings
export async function GET() {
  try {
    const sql = getDb();
    const settings = await sql`
      SELECT automatic_enabled, manual_enabled 
      FROM payment_settings 
      LIMIT 1
    `;
    return NextResponse.json(settings[0] || { automatic_enabled: true, manual_enabled: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH – update payment settings (admin only)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { automatic_enabled, manual_enabled } = await req.json();
    const sql = getDb();

    await sql`
      UPDATE payment_settings 
      SET 
        automatic_enabled = ${automatic_enabled ?? true},
        manual_enabled = ${manual_enabled ?? true},
        updated_at = NOW()
      WHERE id = 1
    `;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
