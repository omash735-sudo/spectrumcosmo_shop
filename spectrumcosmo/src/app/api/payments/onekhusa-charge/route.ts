import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[onekhusa-charge] Received body:', body);
    const { amount, currency, phoneNumber, paymentMethod, orderId, customerName } = body;

    // Build absolute URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    console.log('[onekhusa-charge] baseUrl:', baseUrl);

    // 1. Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    console.log('[onekhusa-charge] Token response status:', tokenRes.status);
    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('[onekhusa-charge] Token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // 2. Fetch connector_id from database
    const sql = getDb();
    const [option] = await sql`
      SELECT connector_id FROM payment_options
      WHERE name = ${paymentMethod} AND is_active = true
    `;
    console.log('[onekhusa-charge] Connector option:', option);
    if (!option?.connector_id) {
      return NextResponse.json({ error: `Unsupported payment method: ${paymentMethod}` }, { status: 400 });
    }
    const connectorId = option.connector_id;

    // 3. Transaction reference
    const transactionReference = orderId.slice(-12).padStart(12, '0');
    console.log('[onekhusa-charge] transactionReference:', transactionReference);

    // 4. Build payload
    const payload: any = {
      amount: amount.toString(),
      currency: currency || 'MWK',
      connectorId,
      merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!),
      organisationId: process.env.ONEKHUSA_ORG_ID,
      transactionReference,
      callbackUrl: `${baseUrl}/api/payments/onekhusa-webhook`,
      returnUrl: `${baseUrl}/account/orders`,
      description: `Order ${orderId}`,
    };
    if (paymentMethod.toLowerCase().includes('airtel') || paymentMethod.toLowerCase().includes('tnm')) {
      payload.payerPhoneNumber = phoneNumber;
      payload.payerName = customerName;
    }
    console.log('[onekhusa-charge] Payload to OneKhusa:', payload);

    // 5. Call OneKhusa
    const endpoint = `${process.env.ONEKHUSA_BASE_URL}/collections/requestToPayCheckout`;
    console.log('[onekhusa-charge] Calling endpoint:', endpoint);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    console.log('[onekhusa-charge] OneKhusa response status:', response.status);
    console.log('[onekhusa-charge] OneKhusa response data:', data);

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Payment initiation failed' }, { status: 400 });
    }

    const redirectUrl = data.redirectUrl || data.checkoutUrl || null;
    const transactionId = data.transactionId || null;
    if (transactionId) {
      await sql`UPDATE orders SET onekhusa_transaction_id = ${transactionId} WHERE id = ${orderId}`;
    }
    if (!redirectUrl) {
      return NextResponse.json({ error: 'No payment URL returned' }, { status: 500 });
    }
    return NextResponse.json({ redirectUrl, transactionId });
  } catch (err: any) {
    console.error('[onekhusa-charge] Unhandled error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
