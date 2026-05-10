import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId, customerName, phoneNumber, paymentMethod } = body;

    // Build absolute URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // 1. Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('[onekhusa-charge] Token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // 2. Generate a unique source reference number
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-4)}`;

    // 3. Build payload (as per OneKhusa documentation)
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

    // 4. Call OneKhusa
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
    console.log('[onekhusa-charge] OneKhusa response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || data.message || 'Payment initiation failed' }, { status: response.status });
    }

    // Try to extract a redirect URL from common field names
    let redirectUrl = data.redirectUrl || data.checkoutUrl || data.paymentUrl || data.url || null;
    const transactionId = data.transactionId || data.id || data.reference || null;

    // Store transaction ID in the order
    const sql = getDb();
    if (transactionId) {
      await sql`
        UPDATE orders SET onekhusa_transaction_id = ${transactionId}
        WHERE id = ${orderId}
      `;
    }

    // If no redirect URL, we must rely on webhook – redirect user to a pending page
    if (!redirectUrl) {
      // Redirect to order tracking page with a message that payment is being processed
      redirectUrl = `${baseUrl}/account/orders?pending=true`;
    }

    return NextResponse.json({ redirectUrl, transactionId });
  } catch (err: any) {
    console.error('[onekhusa-charge] Unhandled error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
