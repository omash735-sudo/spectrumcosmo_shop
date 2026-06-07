// app/api/onekhusa/token/route.ts
import { NextResponse } from 'next/server';

let cachedToken: { token: string; expiresAt: number } | null = null;

export async function GET() {
  // Return cached token if still valid (4.5 minutes)
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return NextResponse.json({ accessToken: cachedToken.token });
  }

  const apiKey = process.env.ONEKHUSA_API_KEY;
  const apiSecret = process.env.ONEKHUSA_API_SECRET;
  const organisationId = process.env.ONEKHUSA_ORG_ID;
  const merchantAccountNumber = process.env.ONEKHUSA_MERCHANT_ACCOUNT;

  // Validate required environment variables
  const missing: string[] = [];
  if (!apiKey) missing.push('ONEKHUSA_API_KEY');
  if (!apiSecret) missing.push('ONEKHUSA_API_SECRET');
  if (!organisationId) missing.push('ONEKHUSA_ORG_ID');
  if (!merchantAccountNumber) missing.push('ONEKHUSA_MERCHANT_ACCOUNT');
  if (missing.length) {
    console.error('Missing OneKhusa config:', missing);
    return NextResponse.json(
      { error: `Missing configuration: ${missing.join(', ')}` },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `${process.env.ONEKHUSA_BASE_URL}/account/getAccessToken`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          apiSecret,
          organisationId,
          merchantAccountNumber: Number(merchantAccountNumber),
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Token fetch failed');
    }

    // Cache token for 4.5 minutes (slightly less than 5 min expiry)
    cachedToken = {
      token: data.accessToken,
      expiresAt: Date.now() + 4.5 * 60 * 1000,
    };

    return NextResponse.json({ accessToken: data.accessToken });
  } catch (err) {
    console.error('Token fetch error:', err);
    const errorMessage =
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err instanceof Error
        ? err.message
        : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
