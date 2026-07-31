import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export async function GET() {
  try {
    const config = await queryOne`
      SELECT 
        key,
        value,
        is_enabled as "isEnabled"
      FROM system_config
      WHERE key = 'onboarding_enabled'
    `;

    const isEnabled = config ? config.isEnabled : true;

    return NextResponse.json({ isEnabled });
  } catch (error) {
    console.error('Failed to fetch onboarding config:', error);
    return NextResponse.json({ isEnabled: true });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { isEnabled } = body;

    await queryOne`
      INSERT INTO system_config (key, value, is_enabled, updated_at)
      VALUES ('onboarding_enabled', ${String(isEnabled)}, ${isEnabled}, NOW())
      ON CONFLICT (key) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        is_enabled = EXCLUDED.is_enabled,
        updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update onboarding config:', error);
    return NextResponse.json(
      { error: 'Failed to update onboarding config' },
      { status: 500 }
    );
  }
}
