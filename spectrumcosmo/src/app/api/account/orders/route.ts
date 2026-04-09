import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserFromRequest } from '@/lib/userAuth'
import { sendMail } from '@/lib/mailer'

async function ensureOrdersSchema() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      customer_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      product_name TEXT NOT NULL,
      custom_details TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_of_payment_url TEXT`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_note TEXT`
}

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await ensureOrdersSchema()
    const sql = getDb()
    const orders = await sql`SELECT * FROM orders WHERE user_id = ${user.id} ORDER BY created_at DESC`
    return NextResponse.json(orders)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await ensureOrdersSchema()
    const { id, proofOfPaymentUrl, paymentNote } = await req.json()
    if (!id || !proofOfPaymentUrl) {
      return NextResponse.json({ error: 'id and proofOfPaymentUrl required' }, { status: 400 })
    }

    const sql = getDb()
    const [order] = await sql`
      UPDATE orders
      SET proof_of_payment_url = ${proofOfPaymentUrl}, payment_note = ${paymentNote || ''}
      WHERE id = ${id} AND user_id = ${user.id}
      RETURNING *
    `
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    await sendMail({
      to: user.email,
      subject: 'Payment proof received',
      text: `We received your payment proof for order ${order.product_name}.`,
    }).catch(() => null)

    const adminEmail = process.env.ADMIN_EMAIL
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: 'New payment proof uploaded',
        text: `${user.name} uploaded payment proof for ${order.product_name}: ${proofOfPaymentUrl}`,
      }).catch(() => null)
    }

    return NextResponse.json(order)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

