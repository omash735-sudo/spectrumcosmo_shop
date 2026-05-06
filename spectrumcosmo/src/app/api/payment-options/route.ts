import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const sql = getDb()
    const options = await sql`
      SELECT id, type, name, logo_url, account_number, is_active, sort_order
      FROM payment_options
      WHERE is_active = true
      ORDER BY sort_order ASC
    `
    return NextResponse.json(options)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
