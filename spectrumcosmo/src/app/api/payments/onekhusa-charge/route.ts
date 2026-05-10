import { NextRequest, NextResponse } from 'next/server';

// Map your exact payment method names (from your `payment_options` table) to OneKhusa connector IDs
const connectorMap: Record<string, string> = {
  'Airtel Money': '112400',
  'TNM Mpamba': '112500',
  'National Bank of Malawi': '221300',
  'NBS Bank': '221400',
};

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, phoneNumber, paymentMethod, orderId, customerName } = await req.json();

    // Get access token
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenData.accessToken) throw new Error('Failed to get access token');

    const connectorId = connectorMap[paymentMethod];
    if (!connectorId) {
      return NextResponse.json({ error: `Unsupported payment method: ${paymentMethod}` }, { status: 400 });
    }

    // Transaction reference must be exactly 12 characters
    const transactionReference = orderId.slice(-12).padStart(12, '0');

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

    // For mobile money, add payer phone number and name (banks use hosted page only)
    if (paymentMethod.toLowerCase().includes('airtel') || paymentMethod.toLowerCase().includes('tnm')) {
      payload.payerPhoneNumber = phoneNumber;
      payload.payerName = customerName;
    }

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
      console.error('OneKhusa charge error:', data);
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
