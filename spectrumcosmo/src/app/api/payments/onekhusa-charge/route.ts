import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, phoneNumber, paymentMethod, orderId, customerName } = await req.json();

    // Build absolute URL for internal API calls
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Get access token using absolute URL
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('Token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // Fetch connector_id from database
    const sql = getDb();
    const [option] = await sql`
      SELECT connector_id FROM payment_options
      WHERE name = ${paymentMethod} AND is_active = true
    `;
    if (!option?.connector_id) {
      return NextResponse.json({ error: `Unsupported payment method: ${paymentMethod}` }, { status: 400 });
    }
    const connectorId = option.connector_id;

    // Transaction reference (must be exactly 12 characters)
    const transactionReference = orderId.slice(-12).padStart(12, '0');

    // Build payload for OneKhusa
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

    // For mobile money, add payer phone number and name
    if (paymentMethod.toLowerCase().includes('airtel') || paymentMethod.toLowerCase().includes('tnm')) {
      payload.payerPhoneNumber = phoneNumber;
      payload.payerName = customerName;
    }

    // Call OneKhusa
    const endpoint = `${process.env.ONEKHUSA_BASE_URL}/collections/requestToPayCheckout`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OneKhusa error:', data);
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
    console.error('OneKhusa charge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
