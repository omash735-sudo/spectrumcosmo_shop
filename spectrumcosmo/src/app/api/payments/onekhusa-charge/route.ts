import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, currency, phoneNumber, orderId, customerName } = body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }
    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

    // Get access token
    const tokenRes = await fetch(`${baseUrl}/api/payments/onekhusa-token`);
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.accessToken) {
      console.error('Token fetch failed:', tokenData);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 });
    }
    const accessToken = tokenData.accessToken;

    // Generate unique reference number (must be unique per transaction)
    const referenceNumber = `REF-${orderId.slice(-8)}-${Date.now()}`;

    // Build payload for OneKhusa (using the simple request-to-pay endpoint)
    const payload = {
      merchantAccountNumber: parseInt(process.env.ONEKHUSA_MERCHANT_ACCOUNT!),
      transactionAmount: Number(amount),
      transactionDescription: `Order ${orderId}`,
      referenceNumber: referenceNumber,
      capturedBy: customerName || 'customer@checkout',
    };

    console.log('OneKhusa payload:', payload);

    const response = await fetch('https://api.onekhusa.com/sandbox/v1/collections/requestToPay/initiate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': referenceNumber,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('OneKhusa response:', data);

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || 'Payment initiation failed' }, { status: response.status });
    }

    const paymentTransactionId = data.paymentTransactionId || null;
    if (paymentTransactionId) {
      const sql = getDb();
      await sql`
        UPDATE orders SET onekhusa_transaction_id = ${paymentTransactionId}
        WHERE id = ${orderId}
      `;
    }

    // Return success (no redirect needed)
    return NextResponse.json({ success: true, paymentTransactionId });
  } catch (err: any) {
    console.error('OneKhusa charge error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
