import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// OneKhusa API configuration
const ONEXHUSA_API = {
  baseUrl: 'https://api.onekhusa.com/sandbox/v1',
  initiateCheckout: '/checkout/rtp/initiate',
  oauthToken: '/account/getAccessToken',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, orderId, customerName, phoneNumber, paymentMethod, items } = body;

    // Validate required fields
    if (!amount || !orderId) {
      return NextResponse.json({ error: 'Missing required fields: amount, orderId' }, { status: 400 });
    }

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

    // 2. Fetch connector_id from database
    const sql = getDb();
    const [option] = await sql`
      SELECT connector_id FROM payment_options
      WHERE name = ${paymentMethod} AND is_active = true
    `;
    if (!option?.connector_id) {
      return NextResponse.json({ error: `Unsupported payment method: ${paymentMethod}` }, { status: 400 });
    }
    const connectorId = option.connector_id;

    // 3. Generate a unique source reference number
    const sourceReferenceNumber = `SRN-${orderId.slice(-8)}-${Date.now().toString().slice(-4)}`;

    // 4. Build the correct payload for OneKhusa
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

    // 5. Call OneKhusa's checkout initiate endpoint
    const endpoint = `${ONEXHUSA_API.baseUrl}${ONEXHUSA_API.initiateCheckout}`;
    console.log('[onekhusa-charge] Calling endpoint:', endpoint);
    console.log('[onekhusa-charge] Payload:', JSON.stringify(payload, null, 2));

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

    // Store the transaction ID in the order
    if (transactionId) {
      await sql`
        UPDATE orders SET onekhusa_transaction_id = ${transactionId}
        WHERE id = ${orderId}
      `;
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
