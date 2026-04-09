import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      next: { revalidate: 60 * 60 },
    })
    if (!response.ok) throw new Error('Failed to fetch rates')
    const data = await response.json()

    return NextResponse.json({
      USD: 1,
      MWK: data?.rates?.MWK ?? 1750,
      ZAR: data?.rates?.ZAR ?? 18.5,
      EUR: data?.rates?.EUR ?? 0.92,
      updatedAt: data?.time_last_update_utc ?? null,
    })
  } catch {
    return NextResponse.json(
      { USD: 1, MWK: 1750, ZAR: 18.5, EUR: 0.92, fallback: true },
      { status: 200 },
    )
  }
}

