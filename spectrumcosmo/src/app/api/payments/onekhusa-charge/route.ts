import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, phoneNumber, paymentMethod, orderId, customerName } = await req.json();

    // 1. Get access token
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenData.accessToken) throw new Error('Failed to get access token');

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

    // 3. Transaction reference (must be exactly 12 characters)
    const transactionReference = orderId.slice(-12).padStart(12, '0');

    // 4. Build payload
    const payload: any = {
      amount: amount.toString(),
      currency: currency || 'MWK',
      connectorId,
      merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!),
      organisationId: process.env.ONEKHUSA_ORG_ID,
      transactionReference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-webhook`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`,
      description: `Order ${orderId}`,
    };

    // 5. For mobile money, add payer phone number and name
    if (paymentMethod.toLowerCase().includes('airtel') || paymentMethod.toLowerCase().includes('tnm')) {
      payload.payerPhoneNumber = phoneNumber;
      payload.payerName = customerName;
    }

    // 6. Call OneKhusa
    const endpoint = `${process.env.ONEKHUSA_BASE_URL}/collections/requestToPayCheckout`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OneKhusa error:', data);
      return NextResponse.json({ error: data.detail || 'Payment initiation failed' }, { status: 400 });
    }

    const redirectUrl = data.redirectUrl || data.checkoutUrl || null;
    if (!redirectUrl) {
      return NextResponse.json({ error: 'No payment URL returned' }, { status: 500 });
    }

    return NextResponse.json({ redirectUrl, transactionId: data.transactionId });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
