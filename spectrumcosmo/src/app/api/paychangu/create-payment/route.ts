import { NextRequest, NextResponse } from "next/server"
import type { PayChanguRequest } from "@/lib/paychangu/types"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      amount,
      email,
      first_name,
      last_name,
      order_id,
    } = body

    if (!amount || !email || !order_id) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const tx_ref = `order-${order_id}-${Date.now()}`

    const payload: PayChanguRequest = {
      amount,
      currency: "MWK",
      email,
      first_name,
      last_name,
      tx_ref,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/paychangu/webhook`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/order-success`,
      customization: {
        title: "SpectrumCosmo",
        description: `Order #${order_id}`,
      },
      meta: {
        order_id,
      },
    }

    const response = await fetch("https://api.paychangu.com/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY!}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error(err)

      return NextResponse.json(
        { error: "Payment initialization failed" },
        { status: 500 }
      )
    }

    const data = await response.json()

    return NextResponse.json({
      checkout_url: data.data.checkout_url,
      tx_ref,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    )
  }
}
