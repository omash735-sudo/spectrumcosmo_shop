import { NextResponse } from 'next/server';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function GET() {
  // Return cached token if still valid (5 min expiry)
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return NextResponse.json({ accessToken: cachedToken.token });
  }

  const apiKey = process.env.ONEKHUSA_API_KEY;
  const apiSecret = process.env.ONEKHUSA_API_SECRET;
  const organisationId = process.env.ONEKHUSA_ORG_ID;
  const merchantAccountNumber = process.env.ONEKHUSA_MERCHANT_ACCOUNT;

  if (!apiKey || !apiSecret || !organisationId || !merchantAccountNumber) {
    return NextResponse.json({ error: 'Missing OneKhusa config' }, { status: 500 });
  }

  try {
    const response = await fetch(`${process.env.ONEKHUSA_BASE_URL}/account/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        apiSecret,
        organisationId,
        merchantAccountNumber: parseInt(merchantAccountNumber),
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('OneKhusa token error:', data);
      return NextResponse.json({ error: 'Failed to get access token' }, { status: response.status });
    }

    // Cache token for 4.5 minutes (less than 5 min expiry)
    cachedToken = {
      token: data.accessToken,
      expiresAt: Date.now() + 4.5 * 60 * 1000,
    };

    return NextResponse.json({ accessToken: data.accessToken });
  } catch (err: any) {
    console.error('Token fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
      }
