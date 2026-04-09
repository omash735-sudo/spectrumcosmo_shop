import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'

async function ensureSettingsTable() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
}

export async function GET() {
  try {
    await ensureSettingsTable()
    const sql = getDb()
    const rows = await sql`SELECT value FROM site_settings WHERE key='social_links'`
    return NextResponse.json(
      rows[0]?.value || {
        instagram: '',
        twitter: '',
        facebook: '',
        tiktok: '',
        whatsapp: '',
        email: 'spectrumcosmo01@gmail.com',
      },
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  try {
    await ensureSettingsTable()
    const body = await req.json()
    const sql = getDb()
    const [row] = await sql`
      INSERT INTO site_settings (key, value)
      VALUES ('social_links', ${body}::jsonb)
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
      RETURNING value
    `
    return NextResponse.json(row.value)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

