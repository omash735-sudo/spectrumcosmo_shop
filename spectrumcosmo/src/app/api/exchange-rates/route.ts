import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Frankfurter API - more reliable, free, no API key needed
    const response = await fetch('https://api.frankfurter.app/latest?from=USD&to=MWK,ZAR,EUR,GBP', {
      next: { revalidate: 300 }, // refresh every 5 minutes
    });
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();

    return NextResponse.json({
      USD: 1,
      MWK: data.rates?.MWK ?? 1750,
      ZAR: data.rates?.ZAR ?? 18.5,
      EUR: data.rates?.EUR ?? 0.92,
      GBP: data.rates?.GBP ?? 0.75,
      updatedAt: data.date,
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
    
    // Return cached/fallback rates - prevents site from breaking
    return NextResponse.json(
      {
        USD: 1,
        MWK: 1750,
        ZAR: 18.5,
        EUR: 0.92,
        GBP: 0.75,
        fallback: true,
        updatedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
