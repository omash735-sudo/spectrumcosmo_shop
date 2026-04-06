import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const sql = getDb()
  const [payments, deliveries] = await Promise.all([
    sql`SELECT * FROM payment_options WHERE is_active = true ORDER BY type, sort_order`,
    sql`SELECT * FROM delivery_methods WHERE is_active = true ORDER BY name`,
  ])
  return NextResponse.json({ payments, deliveries })
}
