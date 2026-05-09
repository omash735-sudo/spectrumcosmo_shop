import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET() {
  const sql = getDb()
  const rows = await sql`SELECT key, value FROM site_settings`
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const updates = await req.json()
  const sql = getDb()
  for (const [key, value] of Object.entries(updates)) {
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
  }
  return NextResponse.json({ success: true })
}
