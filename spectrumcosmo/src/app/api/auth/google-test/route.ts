import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
  const secret = process.env.AUTH_GOOGLE_SECRET;

  return NextResponse.json({
    clientId: clientId ? clientId.substring(0, 15) + '...' : 'missing',
    redirectUri: redirectUri,
    nextauthUrl: process.env.NEXTAUTH_URL,
    secretSet: !!secret,
    allVars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'set' : 'missing',
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? 'set' : 'missing',
      AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? 'set' : 'missing',
    }
  });
}
