import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId, customerName, customerEmail, phoneNumber } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

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

    // 2. Unique reference (must be unique per request)
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-6)}`;

    // 3. Build payload as per the working example (without customer object to avoid validation issues)
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
    console.log('OneKhusa response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      // Return the validation error details
      const errorMsg = data.detail || data.message || (data.errors ? data.errors.join(', ') : 'Payment initiation failed');
      return NextResponse.json({ error: errorMsg }, { status: response.status });
    }

    const paymentTransactionId = data.paymentTransactionId || null;
    if (paymentTransactionId) {
      const sql = getDb();
      await sql`
        UPDATE orders SET onekhusa_transaction_id = ${paymentTransactionId}
        WHERE id = ${orderId}
      `;
    }

    // Even without a redirect URL, the payment request has been queued.
    return NextResponse.json({ success: true, paymentTransactionId });
  } catch (err: any) {
    console.error('OneKhusa charge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
