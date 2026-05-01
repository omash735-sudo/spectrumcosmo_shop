import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db/neon"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const phone = searchParams.get("phone")

    // Base query
    let query = `
      SELECT *
      FROM orders
      ORDER BY created_at DESC
    `

    let values: any[] = []

    // Optional filter (useful for customer view later)
    if (phone) {
      query = `
        SELECT *
        FROM orders
        WHERE phone = $1
        ORDER BY created_at DESC
      `
      values = [phone]
    }

    const result = await sql.query(query, values)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching orders:", error)

    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    )
  }
}
