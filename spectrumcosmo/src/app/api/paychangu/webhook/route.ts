import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { sql } from "@/lib/db/neon"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("Signature")

    const secret = process.env.PAYCHANGU_SECRET_KEY!

    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex")

    if (signature !== expected) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      )
    }

    const event = JSON.parse(rawBody)

    const orderId = event?.meta?.order_id

    if (event.status === "success" && orderId) {
      await sql.query(
        `UPDATE orders
         SET status = 'paid'
         WHERE id = $1`,
        [orderId]
      )
    }

    if (event.status === "failed" && orderId) {
      await sql.query(
        `UPDATE orders
         SET status = 'failed'
         WHERE id = $1`,
        [orderId]
      )
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: "Webhook failed" },
      { status: 500 }
    )
  }
}
