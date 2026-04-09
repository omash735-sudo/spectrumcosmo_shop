import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { requireAdmin } from '@/lib/auth'
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
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS unit_price_usd NUMERIC`
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_price_usd NUMERIC`
}

export async function POST(req: NextRequest) {
  try {
    await ensureOrdersSchema()
    const { customer_name, phone_number, product_name, custom_details, quantity, unit_price_usd, total_price_usd } = await req.json()
    if (!customer_name || !phone_number || !product_name) return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    const user = getUserFromRequest(req)
    const qty = Math.max(1, Number(quantity || 1))
    const unit = unit_price_usd ? Number(unit_price_usd) : null
    const total = total_price_usd ? Number(total_price_usd) : unit ? unit * qty : null
    const sql = getDb()
    const [data] = await sql`
      INSERT INTO orders (customer_name, phone_number, product_name, custom_details, status, user_id, customer_email, quantity, unit_price_usd, total_price_usd)
      VALUES (${customer_name}, ${phone_number}, ${product_name}, ${custom_details || ''}, 'pending', ${user?.id || null}, ${user?.email || null}, ${qty}, ${unit}, ${total})
      RETURNING *
    `
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  await ensureOrdersSchema()
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const sql = getDb()
    const data = await sql`SELECT * FROM orders ORDER BY created_at DESC`
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  await ensureOrdersSchema()
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })
    const normalized = String(status).toLowerCase()
    if (!['pending', 'approved', 'declined'].includes(normalized)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    const sql = getDb()
    const [data] = await sql`UPDATE orders SET status=${normalized} WHERE id=${id} RETURNING *`
    if (data?.customer_email) {
      await sendMail({
        to: data.customer_email,
        subject: `Order update: ${data.product_name}`,
        text: `Hi ${data.customer_name}, your order status is now "${normalized}".`,
      }).catch(() => null)
    }
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  await ensureOrdersSchema()
  const authError = requireAdmin(req)
  if (authError) return authError
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const sql = getDb()
    await sql`DELETE FROM orders WHERE id=${id}`
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
