// app/api/social-links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne, queryMany } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

async function ensureSettingsTable() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

const defaultSocialLinks = {
  instagram: '',
  twitter: '',
  facebook: '',
  tiktok: '',
  whatsapp: '',
  email: 'spectrumcosmo01@gmail.com',
};

export async function GET() {
  try {
    await ensureSettingsTable();

    const socialLinksRow = await queryOne<{ value: any }>`
      SELECT value FROM site_settings WHERE key = 'social_links'
    `;

    const socialLinks = socialLinksRow?.value ?? defaultSocialLinks;
    return NextResponse.json(socialLinks);
  } catch (err) {
    console.error('Failed to fetch social links:', err);
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
    await ensureSettingsTable();
    const body = await req.json();

    const updatedRow = await queryOne<{ value: any }>`
      INSERT INTO site_settings (key, value)
      VALUES ('social_links', ${body}::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING value
    `;

    const socialLinks = updatedRow?.value ?? defaultSocialLinks;
    return NextResponse.json(socialLinks);
  } catch (err) {
    console.error('Failed to update social links:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
