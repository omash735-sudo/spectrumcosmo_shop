// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { queryMany } from '@/lib/db';

export async function GET() {
  try {
    const rows = await queryMany<{ setting_key: string; setting_value: string }>`
      SELECT setting_key, setting_value FROM system_settings
    `;
    const settings = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
    return NextResponse.json(settings);
  } catch (err) {
    console.error('Settings fetch error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const updates = await req.json();
    // Use the same helper for each update (could be batched, but fine for MVP)
    for (const [key, value] of Object.entries(updates)) {
      await queryMany`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
      `;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Settings update error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PATCH – same as PUT for simplicity (idempotent)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  try {
    const updates = await req.json();
    for (const [key, value] of Object.entries(updates)) {
      await queryMany`
        INSERT INTO system_settings (setting_key, setting_value, updated_at)
        VALUES (${key}, ${String(value)}, NOW())
        ON CONFLICT (setting_key) DO UPDATE 
        SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
      `;
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Settings update error:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
