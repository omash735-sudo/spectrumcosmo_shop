import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId, customerName, customerEmail, phoneNumber } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 1. Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('Token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // 2. Unique reference (idempotency key)
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-4)}`;

    // 3. Payload for hosted checkout (as per OneKhusa example)
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
        // Optional: add customer details if your API supports it
        customer: {
          name: customerName,
          email: customerEmail,
          phoneNumber,
        },
      },
      route: {
        successRedirectionUrl: `${baseUrl}/account/orders`,
        failureRedirectionUrl: `${baseUrl}/checkout/payment?orderId=${orderId}`,
        callbackApiUrl: `${baseUrl}/api/payments/onekhusa-webhook`,
      },
    };

    // 4. Call OneKhusa
    const response = await fetch('https://api.onekhusa.com/sandbox/v1/checkout/rtp/initiate', {
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
      return NextResponse.json({ error: data.detail || data.message || 'Payment initiation failed' }, { status: response.status });
    }

    // 5. Extract redirect URL and transaction ID
    const redirectUrl = data.redirectUrl || data.checkoutUrl || null;
    const transactionId = data.transactionId || data.paymentTransactionId || null;

    if (transactionId) {
      const sql = getDb();
      await sql`
        UPDATE orders SET onekhusa_transaction_id = ${transactionId}
        WHERE id = ${orderId}
      `;
    }

    if (!redirectUrl) {
      return NextResponse.json({ error: 'No payment URL returned by OneKhusa' }, { status: 500 });
    }

    return NextResponse.json({ redirectUrl, transactionId });
  } catch (err: any) {
    console.error('OneKhusa charge error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
