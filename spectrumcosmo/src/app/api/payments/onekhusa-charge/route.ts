import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Charge API called with body:', body);
    // Always return a valid JSON response
    return NextResponse.json({ redirectUrl: 'https://example.com/payment' });
  } catch (err: any) {
    console.error('Mock charge error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
