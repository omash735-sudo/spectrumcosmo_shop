// app/api/admin/social-links/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb, queryOne } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

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
    const sql = getDb();

    const socialLinksRow = await queryOne<{ setting_value: string }>`
      SELECT setting_value FROM system_settings WHERE setting_key = 'social_links'
    `;

    const socialLinks = socialLinksRow?.setting_value 
      ? JSON.parse(socialLinksRow.setting_value) 
      : defaultSocialLinks;
    
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
    const sql = getDb();
    const body = await req.json();

    await sql`
      INSERT INTO system_settings (setting_key, setting_value, updated_at)
      VALUES ('social_links', ${JSON.stringify(body)}::jsonb, NOW())
      ON CONFLICT (setting_key) DO UPDATE 
      SET setting_value = EXCLUDED.setting_value, updated_at = NOW()
    `;

    return NextResponse.json({ success: true, data: body });
  } catch (err) {
    console.error('Failed to update social links:', err);
    const errorMessage = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
