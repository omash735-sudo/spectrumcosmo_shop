// src/app/api/payments/onekhusa-charge/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, phoneNumber, orderId, customerName, paymentMethod } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // Generate reference
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-4)}`;

    // Build payload for request-to-pay (mobile money)
    const payload = {
      authentication: {
        apiKey: process.env.ONEKHUSA_API_KEY,
        apiSecret: process.env.ONEKHUSA_API_SECRET,
      },
      merchant: {
        organisationId: process.env.ONEKHUSA_ORG_ID,
        merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!),
      },
      payment: {
        sourceReferenceNumber,
        description: `Order ${orderId}`,
        amount: Number(amount),
        currency: currency || 'MWK',
        customer: {
          name: customerName,
          phoneNumber: phoneNumber,
        },
      },
      route: {
        callbackApiUrl: `${baseUrl}/api/payments/onekhusa-webhook`,
      },
    };

    // Use the request-to-pay endpoint (no redirect)
    const response = await fetch('https://api.onekhusa.com/sandbox/v1/collections/requestToPay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': sourceReferenceNumber,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('OneKhusa initiate response:', data);

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Payment initiation failed' }, { status: response.status });
    }

    const transactionId = data.paymentTransactionId || null;
    if (transactionId) {
      const sql = getDb();
      await sql`UPDATE orders SET onekhusa_transaction_id = ${transactionId} WHERE id = ${orderId}`;
    }

    // No redirect URL – payment request sent to phone
    return NextResponse.json({ success: true, transactionId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
