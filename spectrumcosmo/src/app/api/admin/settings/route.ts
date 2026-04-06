import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const sql = getDb()
  const [content, payments, deliveries] = await Promise.all([
    sql`SELECT * FROM site_content`,
    sql`SELECT * FROM payment_options ORDER BY type, sort_order`,
    sql`SELECT * FROM delivery_methods ORDER BY name`,
  ])
  const about_us = content.find(c => c.key === 'about_us')?.value || ''
  const newsletter = content.find(c => c.key === 'newsletter')?.value || ''
  return NextResponse.json({ about_us, newsletter, payments, deliveries })
}

export async function PUT(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError
  const { about_us, newsletter } = await req.json()
  const sql = getDb()
  await Promise.all([
    sql`INSERT INTO site_content (key, value) VALUES ('about_us', ${about_us}) ON CONFLICT (key) DO UPDATE SET value = ${about_us}, updated_at = NOW()`,
    sql`INSERT INTO site_content (key, value) VALUES ('newsletter', ${newsletter}) ON CONFLICT (key) DO UPDATE SET value = ${newsletter}, updated_at = NOW()`,
  ])
  return NextResponse.json({ success: true })
}
