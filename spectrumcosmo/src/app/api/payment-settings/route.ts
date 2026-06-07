// app/api/payment-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

interface PaymentSettings {
  automatic_enabled: boolean;
  manual_enabled: boolean;
}

export async function GET() {
  try {
    const settings = await queryOne<PaymentSettings>`
      SELECT automatic_enabled, manual_enabled 
      FROM payment_settings 
      LIMIT 1
    `;

    const defaultSettings = { automatic_enabled: true, manual_enabled: true };
    return NextResponse.json(settings || defaultSettings);
  } catch (err) {
    console.error('Failed to fetch payment settings:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const { automatic_enabled, manual_enabled } = await req.json();
    const sql = getDb();

    // Insert or update the settings row (assumes id = 1)
    await sql`
      INSERT INTO payment_settings (id, automatic_enabled, manual_enabled, updated_at)
      VALUES (1, ${automatic_enabled ?? true}, ${manual_enabled ?? true}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET automatic_enabled = EXCLUDED.automatic_enabled,
          manual_enabled = EXCLUDED.manual_enabled,
          updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to update payment settings:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
