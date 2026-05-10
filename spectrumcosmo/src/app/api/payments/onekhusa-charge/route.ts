import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, phoneNumber, paymentMethod, orderId, customerName } = await req.json();

    // 1. Get access token
    const tokenRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenData.accessToken) throw new Error('Failed to get access token');

    // 2. Map payment method to connector ID
    const connectorMap: Record<string, string> = {
      airtel_money: '112400',
      tnm_mpamba: '112500',
    };
    const connectorId = connectorMap[paymentMethod];
    if (!connectorId) throw new Error('Unsupported payment method');

    // 3. Generate transaction reference (12 chars)
    const transactionReference = orderId.slice(-12).padStart(12, '0');

    // 4. Build payload – using "Request To Pay Checkout" (hosted page)
    const payload = {
      amount: amount.toString(),
      currency: currency || 'MWK',
      payerPhoneNumber: phoneNumber,
      payerName: customerName,
      connectorId,
      merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!),
      organisationId: process.env.ONEKHUSA_ORG_ID,
      transactionReference,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/onekhusa-webhook`,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/account/orders`, // after payment
      description: `Order ${orderId}`,
    };

    // 5. Call OneKhusa endpoint – change if needed
    const endpoint = `${process.env.ONEKHUSA_BASE_URL}/collections/requestToPayCheckout`; // "Checkout" version
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

    // The response should contain a redirect URL
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
