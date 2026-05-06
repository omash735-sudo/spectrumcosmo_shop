// app/api/account/orders/[id]/tracking/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const orderId = params.id

  try {
    const sql = getDb()

    // Your detailed tracking query
    const [tracking] = await sql`
      SELECT 
        o.id AS order_id,
        o.customer_name,
        o.customer_email,
        o.phone_number,
        o.status AS order_status,
        o.total_amount,
        o.payment_method,
        o.paid_at,
        o.created_at AS order_placed_at,
        
        p.name AS product_name,
        p.price AS unit_price,
        o.quantity,
        o.total_amount,
        
        d.status AS delivery_status,
        d.tracking_number,
        d.delivery_notes,
        d.delivery_address,
        d.created_at AS delivery_created_at,
        
        dm.name AS delivery_method_name,
        dm.logo_url AS delivery_logo,
        
        po.type AS payment_type,
        po.name AS payment_provider,
        po.account_number AS payment_account

      FROM orders o
      LEFT JOIN products p ON p.name = o.product_name
      LEFT JOIN delivery d ON d.order_id::text = o.id::text
      LEFT JOIN delivery_methods dm ON dm.name = o.delivery_method
      LEFT JOIN payment_options po ON po.name = o.payment_method
      WHERE o.id = ${orderId} AND o.user_id = ${user.id}
    `

    if (!tracking) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json(tracking)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
