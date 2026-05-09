import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const authError = requireAdmin(req)
  if (authError) return authError

  const sql = getDb()
  const customers = await sql`
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.account_status,
      u.deleted_at,
      COUNT(o.id) AS total_orders,
      COALESCE(SUM(o.total_amount), 0) AS total_spent,
      MAX(o.created_at) AS last_order_date
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.id
    WHERE u.deleted_at IS NULL
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `
  return NextResponse.json(customers)
}
