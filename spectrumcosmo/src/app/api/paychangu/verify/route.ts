import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tx_ref = searchParams.get("tx_ref")

    if (!tx_ref) {
      return NextResponse.json(
        { error: "Missing tx_ref" },
        { status: 400 }
      )
    }

    const res = await fetch(
      `https://api.paychangu.com/verify-payment/${tx_ref}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYCHANGU_SECRET_KEY!}`,
        },
      }
    )

    const data = await res.json()

    const verified =
      data?.status === "success" &&
      data?.data?.status === "success"

    return NextResponse.json({
      verified,
      data: data.data,
    })
  } catch (err) {
    console.error(err)

    return NextResponse.json(
      { verified: false },
      { status: 500 }
    )
  }
}
