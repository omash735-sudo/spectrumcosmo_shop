import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 1. Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // 2. Generate source reference
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-4)}`;

    // 3. Build payload
    const payload = {
      authentication: {
        apiKey: process.env.ONEKHUSA_API_KEY,
        apiSecret: process.env.ONEKHUSA_API_SECRET
      },
      merchant: {
        organisationId: process.env.ONEKHUSA_ORG_ID,
        merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!)
      },
      payment: {
        sourceReferenceNumber,
        description: `Order ${orderId}`,
        amount: Number(amount),
        currency: currency || 'MWK'
      },
      route: {
        successRedirectionUrl: `${baseUrl}/account/orders`,
        failureRedirectionUrl: `${baseUrl}/checkout/payment?orderId=${orderId}`,
        callbackApiUrl: `${baseUrl}/api/payments/onekhusa-webhook`
      }
    };

    const endpoint = `https://api.onekhusa.com/sandbox/v1/checkout/rtp/initiate`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': sourceReferenceNumber,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Return the raw response for debugging
    return NextResponse.json({
      debug: data,
      status: response.status,
      ok: response.ok,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
